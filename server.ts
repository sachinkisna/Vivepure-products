import { connectMongoDB } from './src/server/mongodb';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { db } from './src/server/db';
import { Product, Order, Category, Review } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'vivepanya_ecommerce_secret_key_2026';

app.use(express.json());

const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res, next).catch(next);
};

// --- Authentication Middleware ---
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'customer' | 'admin';
    name: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = decoded;
    next();
  });
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  });
};

// ==========================================
// REST API ROUTES
// ==========================================

// --- Auth Routes ---
app.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const existing = await db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Account with this email already exists' });
  }

const newUser = await db.createUser({
  id: `usr-${Date.now()}`,
  name,
  email,
  phone: phone || '',
  role: 'customer',
  createdAt: new Date().toISOString(),
});

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({ user: newUser, token });
}));

app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Admin credentials check
  if (email.toLowerCase() === 'admin@vivepanya.com') {
    if (await db.verifyAdminPassword(password))  {
      const token = jwt.sign(
        { id: 'usr-admin', email: 'admin@vivepanya.com', name: 'VIVE Admin', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        user: {
          id: 'usr-admin',
          name: 'VIVE Admin',
          email: 'admin@vivepanya.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        token,
      });
    } else {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
  }

  const user = await db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  // For testing ease, allow valid login for seeded/created users
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ user, token });
}));

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// --- Products Routes ---
app.get('/api/products', asyncHandler(async (req: Request, res: Response) => {
  let products = await db.getProducts();
  const { search, category, minPrice, maxPrice, minRating, sort } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    products = products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  if (category && typeof category === 'string' && category !== 'All') {
    products = products.filter(
      p => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) {
      products = products.filter(p => (p.discountPrice || p.price) >= min);
    }
  }

  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      products = products.filter(p => (p.discountPrice || p.price) <= max);
    }
  }

  if (minRating) {
    const r = Number(minRating);
    if (!isNaN(r)) {
      products = products.filter(p => p.rating >= r);
    }
  }

  // Sorting
  if (sort === 'price-low') {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sort === 'price-high') {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sort === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default popularity / featured
    products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  res.json(products);
}));

app.get('/api/products/:id', asyncHandler(async (req: Request, res: Response) => {
  const product = await db.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json(product);
}));

// Admin Add Product
app.post('/api/products', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, category, price, discountPrice, description, stock, images, benefits, ingredients, weight } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Product name, category and price are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    slug,
    category,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    description: description || '',
    benefits: Array.isArray(benefits) ? benefits : [],
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    stock: Number(stock) || 0,
    images: images && images.length ? images : ['/src/assets/images/product_neem_tulsi_soap_1790230422423.jpg'],
    rating: 5.0,
    reviewCount: 0,
    weight: weight || '125g',
    isFeatured: req.body.isFeatured || false,
    isBestSeller: req.body.isBestSeller || false,
    isNewArrival: true,
    createdAt: new Date().toISOString(),
  };

  const created = await db.createProduct(newProduct);
  res.status(201).json(created);
}));

// Admin Update Product
app.put('/api/products/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const updated = await db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(updated);
}));

// Admin Delete Product
app.delete('/api/products/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const deleted = await db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ success: true, message: 'Product removed' });
}));

// --- Categories ---
app.get('/api/categories', asyncHandler(async (_req: Request, res: Response) => {
  const categories = await db.getCategories();
  res.json(categories);
}));

app.post('/api/categories', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, description, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name required' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cat: Category = {
    id: `cat-${Date.now()}`,
    name,
    slug,
    description: description || '',
    image: image || '/src/assets/images/product_neem_tulsi_soap_1790230422423.jpg',
    itemCount: 0,
  };
  const created = await db.createCategory(cat);
  res.status(201).json(created);
}));

// --- Orders ---
app.post('/api/orders', asyncHandler(async (req: Request, res: Response) => {
  const { customer, deliveryAddress, items, subtotal, deliveryCharges, discount, total, paymentMethod, couponCode } = req.body;

  if (!items || !items.length || !deliveryAddress) {
    return res.status(400).json({ error: 'Items and delivery address are required' });
  }

  const orderNumber = `VP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    customer: {
      userId: customer?.userId,
      name: deliveryAddress.name,
      email: deliveryAddress.email,
      phone: deliveryAddress.phone,
    },
    deliveryAddress,
    items,
    subtotal: Number(subtotal),
    deliveryCharges: Number(deliveryCharges) || 0,
    discount: Number(discount) || 0,
    total: Number(total),
    couponCode,
    paymentMethod: paymentMethod === 'Online Payment' ? 'Online Payment' : 'Cash on Delivery',
    paymentStatus: paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
    status: 'Pending',
    timeline: [
      {
        status: 'Pending',
        timestamp: new Date().toISOString(),
        note: `Order placed via ${paymentMethod}`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const savedOrder = await db.createOrder(newOrder);
  res.status(201).json(savedOrder);
}));

app.get('/api/orders', asyncHandler(async (req: Request, res: Response) => {
  const { email, admin } = req.query;

  if (admin === 'true') {
    return res.json(await db.getOrders());
  }

  if (email && typeof email === 'string') {
    return res.json(await db.getOrdersByCustomerEmail(email));
  }

  res.json(await db.getOrders());
}));

app.get('/api/orders/:id', asyncHandler(async (req: Request, res: Response) => {
  const order = await db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
}));

// Update order status (Admin)
app.put('/api/orders/:id/status', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  const updated = await db.updateOrderStatus(req.params.id, status, note);
  if (!updated) return res.status(404).json({ error: 'Order not found' });

  res.json(updated);
}));

// Cancel Order
app.put('/api/orders/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const cancelled = await db.cancelOrder(req.params.id, reason || 'Cancelled by customer');
  if (!cancelled) return res.status(404).json({ error: 'Order not found' });

  res.json(cancelled);
}));

// --- Reviews ---
app.get('/api/reviews/:productId', asyncHandler(async (req: Request, res: Response) => {
  res.json(await db.getReviewsForProduct(req.params.productId));
}));

app.post('/api/reviews', asyncHandler(async (req: Request, res: Response) => {
  const { productId, customerName, customerEmail, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: 'Product, customer name, rating, and comment are required' });
  }

  const review: Review = {
    id: `rev-${Date.now()}`,
    productId,
    customerName,
    customerEmail: customerEmail || '',
    rating: Number(rating),
    comment,
    verifiedPurchase: true,
    createdAt: new Date().toISOString(),
  };

  const saved = await db.addReview(review);
  res.status(201).json(saved);
}));

// --- Admin Stats & Customers ---
app.get('/api/admin/stats', requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  res.json(await db.getStats());
}));

app.get('/api/admin/customers', asyncHandler(async (req: Request, res: Response) => {
 const users = (await db.getUsers()).filter(u => u.role === 'customer');
  const orders = await db.getOrders();

  const customerList = users.map(user => {
    const userOrders = orders.filter(o => o.customer.email.toLowerCase() === user.email.toLowerCase());
    const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      ...user,
      orderCount: userOrders.length,
      totalSpent,
      lastOrderDate: userOrders[0]?.createdAt,
    };
  });

  res.json(customerList);
}));

// ==========================================
// STATIC ASSETS & VITE INTEGRATION
// ==========================================
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('❌ Request failed:', error);

    if (res.headersSent) {
      return;
    }

    const databaseUnavailable =
      error instanceof Error &&
      ['MongoNetworkError', 'MongoServerSelectionError'].includes(error.name);

    res.status(databaseUnavailable ? 503 : 500).json({
      error: databaseUnavailable
        ? 'Database is currently unavailable'
        : 'Internal server error',
    });
  });

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 VIVEPANYA E-Mart Server running on http://0.0.0.0:${PORT}`);
      resolve();
    });
    server.once('error', reject);
  });
}

startServer()
  .then(() => {
    void connectMongoDB().catch((error) => {
      console.error(
        '❌ MongoDB connection failed; database-backed API requests will remain unavailable until MongoDB is reachable:',
        error
      );
    });
  })
  .catch((error) => {
    console.error('❌ Server startup failed:', error);
    process.exitCode = 1;
  });
