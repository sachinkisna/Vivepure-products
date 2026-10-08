import { connectMongoDB } from './src/server/mongodb';
import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, InsufficientStockError } from './src/server/db';
import { Product, Order, Category, Review } from './src/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 random bytes.');
}

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
    phone?: string;
    createdAt: string;
  };
}

const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  const match = typeof authorization === 'string'
    ? authorization.match(/^Bearer\s+([^\s]+)$/i)
    : null;

  if (!match) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = match[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let subject: string;
  let tokenEmail: string;
  try {
    const verified = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof verified === 'string') {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }
    if (typeof verified.sub !== 'string' || typeof verified.email !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }
    subject = verified.sub;
    tokenEmail = verified.email;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }
    throw error;
  }

  let authenticatedUser: AuthRequest['user'];
  if (subject === 'admin' && await db.isAdminIdentity(subject, tokenEmail)) {
    authenticatedUser = {
      id: 'admin',
      email: tokenEmail,
      role: 'admin',
      name: 'VIVE Admin',
      createdAt: '',
    };
  } else {
    const user = await db.findUserById(subject);
    if (!user || user.role !== 'customer' || user.email.toLowerCase() !== tokenEmail.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid or expired authentication' });
    }
    authenticatedUser = {
      id: user.id,
      email: user.email,
      role: 'customer',
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  (req as AuthRequest).user = authenticatedUser;
  next();
});

const requireAdmin: RequestHandler[] = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  },
];

const requireCustomer: RequestHandler[] = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Customer account required' });
    }
    next();
  },
];

const publicUser = (user: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
});

const makeToken = (user: { id: string; email: string; role: 'customer' | 'admin' }) =>
  jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { subject: user.id, expiresIn: '7d', algorithm: 'HS256' }
  );

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

const isValidPassword = (password: string) => {
  const byteLength = Buffer.byteLength(password, 'utf8');
  return password.length >= 8 && byteLength <= 72;
};

// ==========================================
// REST API ROUTES
// ==========================================

// --- Auth Routes ---
app.post('/api/auth/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    name.trim().length > 100 ||
    typeof email !== 'string' ||
    !isValidEmail(email.trim()) ||
    typeof password !== 'string' ||
    !isValidPassword(password) ||
    (phone !== undefined && (typeof phone !== 'string' || phone.length > 30))
  ) {
    return res.status(400).json({ error: 'Enter a valid name, email, password, and phone number.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: `usr-${randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: typeof phone === 'string' ? phone.trim() : '',
    role: 'customer' as const,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  try {
    const createdUser = await db.createUser(user);
    res.status(201).json({ user: publicUser(createdUser), token: makeToken(createdUser) });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    throw error;
  }
}));

app.post('/api/auth/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !isValidEmail(email.trim()) || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter a valid email and password.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await db.verifyAdminCredentials(normalizedEmail, password)) {
    const admin = {
      id: 'admin',
      email: normalizedEmail,
      name: 'VIVE Admin',
      role: 'admin' as const,
      createdAt: '',
    };
    return res.json({ user: publicUser(admin), token: makeToken(admin) });
  }

  const user = await db.findUserByEmail(normalizedEmail);
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const safeUser = publicUser(user);
  res.json({ user: safeUser, token: makeToken(safeUser) });
}));

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as AuthRequest).user });
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
  const { name, category, price, discountPrice, description, stock, images, benefits, ingredients, usage, weight } = req.body;
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
    usage: typeof usage === 'string' ? usage : '',
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
app.post('/api/orders', requireCustomer, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const body = req.body ?? {};
  const deliveryAddress = body.deliveryAddress;
  const requestedItems = body.items;

  if (
    !deliveryAddress ||
    typeof deliveryAddress !== 'object' ||
    ['name', 'phone', 'email', 'address', 'city', 'state', 'pincode'].some(
      field => typeof deliveryAddress[field] !== 'string' || !deliveryAddress[field].trim()
    ) ||
    !isValidEmail(deliveryAddress.email.trim()) ||
    !Array.isArray(requestedItems) ||
    requestedItems.length === 0 ||
    requestedItems.length > 20
  ) {
    return res.status(400).json({ error: 'Valid delivery details and order items are required.' });
  }

  const quantities = new Map<string, number>();
  for (const item of requestedItems) {
    if (
      !item ||
      typeof item.productId !== 'string' ||
      !item.productId.trim() ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 100
    ) {
      return res.status(400).json({ error: 'Each order item must have a valid product and quantity.' });
    }
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 100) {
      return res.status(400).json({ error: 'The quantity for each product cannot exceed 100.' });
    }
    quantities.set(item.productId, quantity);
  }

  if (body.paymentMethod !== 'Cash on Delivery' && body.paymentMethod !== 'Online Payment') {
    return res.status(400).json({ error: 'Choose a supported payment method.' });
  }

  const orderItems: Order['items'] = [];
  let subtotal = 0;
  for (const [productId, quantity] of quantities) {
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'One or more products could not be found.' });
    }
    if (product.stock < quantity) {
      return res.status(409).json({ error: `Insufficient stock for ${product.name}.` });
    }

    const price = product.discountPrice ?? product.price;
    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Product has invalid pricing data.');
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      image: product.images[0] ?? '',
    });
    subtotal += price * quantity;
  }

  const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : undefined;
  let discount = 0;
  if (couponCode === 'VIVE10') {
    discount = Math.round(subtotal * 0.1);
  } else if (couponCode === 'WELCOME20') {
    discount = Math.round(subtotal * 0.2);
  } else if (couponCode === 'FLAT100' && subtotal >= 500) {
    discount = 100;
  } else if (couponCode) {
    return res.status(400).json({ error: 'The coupon code is invalid or does not meet its requirements.' });
  }

  const deliveryCharges = subtotal > 499 ? 0 : 50;
  const total = Math.max(0, subtotal + deliveryCharges - discount);
  const now = new Date().toISOString();
  const orderNumber = `VP-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const normalizedDeliveryAddress = {
    name: deliveryAddress.name.trim(),
    phone: deliveryAddress.phone.trim(),
    email: deliveryAddress.email.trim().toLowerCase(),
    address: deliveryAddress.address.trim(),
    city: deliveryAddress.city.trim(),
    state: deliveryAddress.state.trim(),
    pincode: deliveryAddress.pincode.trim(),
  };

  const newOrder: Order = {
    id: `ord-${randomUUID()}`,
    orderNumber,
    customer: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || normalizedDeliveryAddress.phone,
    },
    deliveryAddress: normalizedDeliveryAddress,
    items: orderItems,
    subtotal,
    deliveryCharges,
    discount,
    total,
    couponCode,
    paymentMethod: body.paymentMethod,
    paymentStatus: 'Pending',
    status: 'Pending',
    timeline: [
      {
        status: 'Pending',
        timestamp: now,
        note: body.paymentMethod === 'Online Payment'
          ? 'Order placed; payment is pending server-side verification.'
          : 'Order placed with cash on delivery.',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  try {
    res.status(201).json(await db.createOrder(newOrder));
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ error: 'One or more products are no longer available in the requested quantity.' });
    }
    throw error;
  }
}));

app.get('/api/orders', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  if (user.role === 'admin') {
    return res.json(await db.getOrders());
  }
  res.json(await db.getOrdersForCustomer(user.id, user.email));
}));

app.get('/api/orders/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const order = await db.getOrderById(req.params.id);
  if (
    !order ||
    (user.role !== 'admin' &&
      order.customer.userId !== user.id &&
      (order.customer.email || '').toLowerCase() !== user.email.toLowerCase())
  ) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json(order);
}));

// Update order status (Admin)
app.put('/api/orders/:id/status', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body;
  const validStatuses: Exclude<Order['status'], 'Cancelled'>[] = [
    'Pending',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'A valid order status is required.' });
  }

  const updated = await db.updateOrderStatus(
    req.params.id,
    status,
    typeof note === 'string' ? note.slice(0, 500) : undefined
  );
  if (!updated) return res.status(404).json({ error: 'Order not found.' });

  res.json(updated);
}));

// Cancel Order
app.put('/api/orders/:id/cancel', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const existing = await db.getOrderById(req.params.id);
  if (
    !existing ||
    (user.role !== 'admin' &&
      existing.customer.userId !== user.id &&
      (existing.customer.email || '').toLowerCase() !== user.email.toLowerCase())
  ) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
  const result = await db.cancelOrder(req.params.id, reason || 'Cancelled by customer');
  if (!result.order) return res.status(404).json({ error: 'Order not found.' });
  if (!result.cancelled && result.order.status !== 'Cancelled') {
    return res.status(409).json({ error: 'This order is no longer eligible for cancellation.' });
  }
  res.json(result.order);
}));

// --- Reviews ---
app.get('/api/reviews/:productId', asyncHandler(async (req: Request, res: Response) => {
  res.json(await db.getReviewsForProduct(req.params.productId));
}));

app.get('/api/admin/reviews', requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  res.json(await db.getReviewsForAdmin());
}));

app.put('/api/admin/reviews/:id/status', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const status = req.body?.status;
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: 'Review status must be approved or rejected.' });
  }

  const review = await db.moderateReview(req.params.id, status);
  if (!review) return res.status(404).json({ error: 'Review not found.' });

  res.json(review);
}));

app.post('/api/reviews', requireCustomer, asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { productId, rating, comment } = req.body ?? {};
  if (
    typeof productId !== 'string' ||
    !productId.trim() ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== 'string' ||
    !comment.trim() ||
    comment.trim().length > 2000
  ) {
    return res.status(400).json({ error: 'A valid product, rating, and review comment are required.' });
  }
  if (!(await db.getProductById(productId))) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const review: Review = {
    id: `rev-${randomUUID()}`,
    productId,
    customerName: user.name,
    customerEmail: user.email,
    rating,
    comment: comment.trim(),
    verifiedPurchase: await db.hasVerifiedPurchase(user.id, user.email, productId),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  const saved = await db.addReview(review);
  res.status(201).json(saved);
}));

// --- Admin Stats & Customers ---
app.get('/api/admin/stats', requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  res.json(await db.getStats());
}));

app.get('/api/admin/customers', requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
 const users = (await db.getUsers()).filter(u => u.role === 'customer');
  const orders = await db.getOrders();

  const customerList = users.map(user => {
    const userOrders = orders.filter(o => o.customer.email.toLowerCase() === user.email.toLowerCase());
    const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
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
    console.error('❌ Request failed:', error instanceof Error ? error.name : 'Unknown error');

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
    void connectMongoDB().catch(() => {
      console.error('❌ MongoDB connection failed; database-backed API requests will remain unavailable.');
    });
  })
  .catch((error) => {
    console.error('❌ Server startup failed:', error instanceof Error ? error.name : 'Unknown error');
    process.exitCode = 1;
  });
