import { User, Product, Category, Order, Review, AdminStats } from '../types';
import bcrypt from 'bcryptjs';
import { getMongoDB } from './mongodb';

class Database {
  // =========================
  // Users & Auth
  // =========================

  public async getUsers(): Promise<User[]> {
    const db = await getMongoDB();

    return db
      .collection<User>('users')
      .find({})
      .toArray();
  }

  public async findUserByEmail(email: string): Promise<User | undefined> {
    const db = await getMongoDB();

    const user = await db.collection<User>('users').findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    });

    return user ?? undefined;
  }

  public async createUser(user: User): Promise<User> {
    const db = await getMongoDB();

    await db.collection<User>('users').insertOne(user);

    return user;
  }

  public async verifyAdminPassword(password: string): Promise<boolean> {
    const db = await getMongoDB();

    const settings = await db.collection<{ _id: string; adminPasswordHash: string }>(
      'settings'
    ).findOne({ _id: 'admin' });

    if (!settings?.adminPasswordHash) {
      return false;
    }

    return bcrypt.compare(password, settings.adminPasswordHash);
  }

  // =========================
  // Products
  // =========================

  public async getProducts(): Promise<Product[]> {
    const db = await getMongoDB();

    return db
      .collection<Product>('products')
      .find({})
      .toArray();
  }

  public async getProductById(id: string): Promise<Product | undefined> {
    const db = await getMongoDB();

    const product = await db.collection<Product>('products').findOne({
      $or: [
        { id },
        { slug: id },
      ],
    });

    return product ?? undefined;
  }

  public async createProduct(product: Product): Promise<Product> {
    const db = await getMongoDB();

    await db.collection<Product>('products').insertOne(product);

    await this.updateCategoryCounts();

    return product;
  }

  public async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    const db = await getMongoDB();

    const result = await db.collection<Product>('products').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return null;
    }

    await this.updateCategoryCounts();

    return result;
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const db = await getMongoDB();

    const result = await db.collection<Product>('products').deleteOne({
      id,
    });

    if (result.deletedCount === 0) {
      return false;
    }

    await this.updateCategoryCounts();

    return true;
  }

  // =========================
  // Categories
  // =========================

  public async getCategories(): Promise<Category[]> {
    await this.updateCategoryCounts();

    const db = await getMongoDB();

    return db
      .collection<Category>('categories')
      .find({})
      .toArray();
  }

  public async createCategory(category: Category): Promise<Category> {
    const db = await getMongoDB();

    await db.collection<Category>('categories').insertOne(category);

    return category;
  }

  private async updateCategoryCounts(): Promise<void> {
    const db = await getMongoDB();

    const products = await db
      .collection<Product>('products')
      .find({})
      .toArray();

    const categories = await db
      .collection<Category>('categories')
      .find({})
      .toArray();

    for (const category of categories) {
      const count = products.filter(
        product =>
          product.category.toLowerCase() === category.name.toLowerCase()
      ).length;

      await db.collection<Category>('categories').updateOne(
        { id: category.id },
        {
          $set: {
            itemCount: count,
          },
        }
      );
    }
  }

  // =========================
  // Orders
  // =========================

  public async getOrders(): Promise<Order[]> {
    const db = await getMongoDB();

    return db
      .collection<Order>('orders')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    const db = await getMongoDB();

    return db
      .collection<Order>('orders')
      .find({
        $or: [
          {
            'customer.email': {
              $regex: `^${escapeRegex(email)}$`,
              $options: 'i',
            },
          },
          {
            'deliveryAddress.email': {
              $regex: `^${escapeRegex(email)}$`,
              $options: 'i',
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async getOrderById(id: string): Promise<Order | undefined> {
    const db = await getMongoDB();

    const order = await db.collection<Order>('orders').findOne({
      $or: [
        { id },
        { orderNumber: { $regex: `^${escapeRegex(id)}$`, $options: 'i' } },
      ],
    });

    return order ?? undefined;
  }

  public async createOrder(order: Order): Promise<Order> {
    const db = await getMongoDB();

    // Reduce product stock
    for (const item of order.items) {
      await db.collection<Product>('products').updateOne(
        { id: item.productId },
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // Create order
    await db.collection<Order>('orders').insertOne(order);

    // Auto-create customer if they don't already exist
    const existingUser = await this.findUserByEmail(
      order.deliveryAddress.email
    );

    if (!existingUser) {
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: order.deliveryAddress.name,
        email: order.deliveryAddress.email,
        phone: order.deliveryAddress.phone,
        role: 'customer',
        createdAt: new Date().toISOString(),
      };

      await this.createUser(newUser);
    }

    return order;
  }

  public async updateOrderStatus(
    id: string,
    status: Order['status'],
    note?: string
  ): Promise<Order | null> {
    const db = await getMongoDB();

    const order = await this.getOrderById(id);

    if (!order) {
      return null;
    }

    const now = new Date().toISOString();

    const timelineEntry = {
      status,
      timestamp: now,
      note: note || `Status updated to ${status}`,
    };

    const update: Record<string, unknown> = {
      status,
      updatedAt: now,
    };

    if (status === 'Delivered') {
      update.paymentStatus = 'Paid';
    }

    await db.collection<Order>('orders').updateOne(
      { id: order.id },
      {
        $set: update,
        $push: {
          timeline: timelineEntry,
        },
      }
    );

    return this.getOrderById(order.id).then(result => result ?? null);
  }

  public async cancelOrder(
    id: string,
    reason: string
  ): Promise<Order | null> {
    const db = await getMongoDB();

    const order = await this.getOrderById(id);

    if (!order) {
      return null;
    }

    // Don't restore stock twice
    if (order.status === 'Cancelled') {
      return order;
    }

    const now = new Date().toISOString();

    await db.collection<Order>('orders').updateOne(
      { id: order.id },
      {
        $set: {
          status: 'Cancelled',
          cancellationReason: reason,
          updatedAt: now,
        },
        $push: {
          timeline: {
            status: 'Cancelled',
            timestamp: now,
            note: `Cancelled: ${reason}`,
          },
        },
      }
    );

    // Restore stock
    for (const item of order.items) {
      await db.collection<Product>('products').updateOne(
        { id: item.productId },
        {
          $inc: {
            stock: item.quantity,
          },
        }
      );
    }

    return this.getOrderById(order.id).then(result => result ?? null);
  }

  // =========================
  // Reviews
  // =========================

  public async getReviewsForProduct(
    productId: string
  ): Promise<Review[]> {
    const db = await getMongoDB();

    return db
      .collection<Review>('reviews')
      .find({ productId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  public async addReview(review: Review): Promise<Review> {
    const db = await getMongoDB();

    await db.collection<Review>('reviews').insertOne(review);

    // Recalculate product rating
    const productReviews = await db
      .collection<Review>('reviews')
      .find({ productId: review.productId })
      .toArray();

    const averageRating =
      productReviews.reduce((sum, item) => sum + item.rating, 0) /
      productReviews.length;

    await db.collection<Product>('products').updateOne(
      { id: review.productId },
      {
        $set: {
          rating: Number(averageRating.toFixed(1)),
          reviewCount: productReviews.length,
        },
      }
    );

    return review;
  }

  // =========================
  // Admin Stats
  // =========================

  public async getStats(): Promise<AdminStats> {
    const db = await getMongoDB();

    const orders = await db
      .collection<Order>('orders')
      .find({})
      .toArray();

    const products = await db
      .collection<Product>('products')
      .find({})
      .toArray();

    const users = await db
      .collection<User>('users')
      .find({})
      .toArray();

    const totalSales = orders
      .filter(order => order.status !== 'Cancelled')
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = orders.filter(
      order => order.status === 'Pending'
    ).length;

    const deliveredOrders = orders.filter(
      order => order.status === 'Delivered'
    ).length;

    const lowStockProducts = products.filter(
      product => product.stock <= 20
    ).length;

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: users.filter(user => user.role === 'customer').length,
      totalSales,
      pendingOrders,
      deliveredOrders,
      lowStockProducts,
    };
  }
}

// Escape user input before using it in MongoDB regex
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const db = new Database();