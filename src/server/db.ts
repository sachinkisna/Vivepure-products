import { User, Product, Category, Order, Review, AdminStats } from '../types';
import bcrypt from 'bcryptjs';
import { getMongoClient, getMongoDB } from './mongodb';

type StoredUser = User & { passwordHash?: string };

const EMAIL_COLLATION = { locale: 'en', strength: 2 } as const;

export class InsufficientStockError extends Error {
  constructor() {
    super('One or more products are unavailable or have insufficient stock.');
    this.name = 'InsufficientStockError';
  }
}

class Database {
  // =========================
  // Users & Auth
  // =========================

  public async getUsers(): Promise<User[]> {
    const db = await getMongoDB();

    return db
      .collection<User>('users')
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
  }

  public async findUserByEmail(email: string): Promise<StoredUser | undefined> {
    const db = await getMongoDB();

    const user = await db.collection<StoredUser>('users').findOne(
      { email: email.trim().toLowerCase() },
      { collation: EMAIL_COLLATION }
    );

    return user ?? undefined;
  }

  public async findUserById(id: string): Promise<StoredUser | undefined> {
    const db = await getMongoDB();
    const user = await db.collection<StoredUser>('users').findOne({ id });
    return user ?? undefined;
  }

  public async createUser(user: StoredUser): Promise<User> {
    const db = await getMongoDB();

    await db.collection<User>('users').insertOne(user);

    return this.toPublicUser(user);
  }

  public async verifyAdminCredentials(email: string, password: string): Promise<boolean> {
    const db = await getMongoDB();

    const settings = await db.collection<{
      _id: string;
      adminEmail?: string;
      adminPasswordHash?: string;
    }>(
      'settings'
    ).findOne({ _id: 'admin' });

    if (
      !settings?.adminEmail ||
      settings.adminEmail.trim().toLowerCase() !== email.trim().toLowerCase() ||
      !settings.adminPasswordHash
    ) {
      return false;
    }

    return bcrypt.compare(password, settings.adminPasswordHash);
  }

  public async isAdminIdentity(id: string, email: string): Promise<boolean> {
    if (id !== 'admin') return false;
    const db = await getMongoDB();
    const settings = await db.collection<{
      _id: string;
      adminEmail?: string;
      adminPasswordHash?: string;
    }>('settings').findOne({ _id: 'admin' });

    return Boolean(
      settings?.adminEmail &&
      settings.adminPasswordHash &&
      settings.adminEmail.trim().toLowerCase() === email.trim().toLowerCase()
    );
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

  public async getOrdersForCustomer(userId: string, email: string): Promise<Order[]> {
    const db = await getMongoDB();
    const normalizedEmail = email.trim().toLowerCase();
    return db.collection<Order>('orders')
      .find({
        $or: [
          { 'customer.userId': userId },
          { 'customer.email': normalizedEmail },
        ],
      })
      .sort({ createdAt: -1 })
      .collation(EMAIL_COLLATION)
      .toArray();
  }

  public async getOrderById(id: string): Promise<Order | undefined> {
    const db = await getMongoDB();

    const order = await db.collection<Order>('orders').findOne({
      $or: [
        { id },
        { orderNumber: id },
      ],
    });

    return order ?? undefined;
  }

  public async createOrder(order: Order): Promise<Order> {
    const db = await getMongoDB();
    const session = getMongoClient().startSession();

    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          const result = await db.collection<Product>('products').updateOne(
            { id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          );

          if (result.matchedCount !== 1) {
            throw new InsufficientStockError();
          }
        }

        await db.collection<Order>('orders').insertOne(order, { session });
      });
    } finally {
      await session.endSession();
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
  ): Promise<{ order: Order | null; cancelled: boolean }> {
    const db = await getMongoDB();
    const session = getMongoClient().startSession();
    const now = new Date().toISOString();
    let cancelled = false;

    try {
      await session.withTransaction(async () => {
        cancelled = false;
        const order = await db.collection<Order>('orders').findOne(
          { $or: [{ id }, { orderNumber: id }] },
          { session }
        );

        if (!order || order.status === 'Cancelled') return;
        if (order.status !== 'Pending' && order.status !== 'Confirmed') return;

        const result = await db.collection<Order>('orders').updateOne(
          { id: order.id, status: { $in: ['Pending', 'Confirmed'] } },
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
          },
          { session }
        );

        if (result.modifiedCount !== 1) return;

        for (const item of order.items) {
          await db.collection<Product>('products').updateOne(
            { id: item.productId },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }
        cancelled = true;
      });
    } finally {
      await session.endSession();
    }

    return { order: await this.getOrderById(id) ?? null, cancelled };
  }

  public async hasVerifiedPurchase(userId: string, email: string, productId: string): Promise<boolean> {
    const db = await getMongoDB();
    const order = await db.collection<Order>('orders').findOne({
      status: 'Delivered',
      'items.productId': productId,
      $or: [
        { 'customer.userId': userId },
        { 'customer.email': email.trim().toLowerCase() },
      ],
    }, { collation: EMAIL_COLLATION });
    return Boolean(order);
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
      .filter(order => order.paymentStatus === 'Paid' && order.status !== 'Cancelled')
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

  private toPublicUser(user: StoredUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}

export const db = new Database();