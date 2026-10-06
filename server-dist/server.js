// src/server/mongodb.ts
import dns from "dns";
import "dotenv/config";
import { MongoClient } from "mongodb";
var nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
var uri = process.env.MONGODB_URI?.trim();
if (uri?.startsWith("mongodb+srv://") && process.platform === "win32") {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  console.log("[MongoDB] Using public DNS servers for MongoDB Atlas SRV resolution.");
}
if (uri?.startsWith("mongodb+srv://") && nodeMajor >= 24) {
  console.warn(
    `[MongoDB] Node ${process.version} has known OpenSSL/TLS incompatibilities with some MongoDB Atlas deployments; use Node 22.x if the Atlas handshake fails with ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR.`
  );
}
var client = new MongoClient(uri ?? "", {
  serverSelectionTimeoutMS: 15e3
});
var db = null;
async function connectMongoDB() {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined in .env. Set it to your local MongoDB URL or MongoDB Atlas URI."
    );
  }
  if (db) {
    return db;
  }
  await client.connect();
  db = client.db("vivepanya");
  console.log("\u2705 Connected to MongoDB Atlas");
  return db;
}
async function getMongoDB() {
  if (db) {
    return db;
  }
  return connectMongoDB();
}

// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// src/server/db.ts
import bcrypt from "bcryptjs";
var Database = class {
  // =========================
  // Users & Auth
  // =========================
  async getUsers() {
    const db3 = await getMongoDB();
    return db3.collection("users").find({}).toArray();
  }
  async findUserByEmail(email) {
    const db3 = await getMongoDB();
    const user = await db3.collection("users").findOne({
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" }
    });
    return user ?? void 0;
  }
  async createUser(user) {
    const db3 = await getMongoDB();
    await db3.collection("users").insertOne(user);
    return user;
  }
  async verifyAdminPassword(password) {
    const db3 = await getMongoDB();
    const settings = await db3.collection(
      "settings"
    ).findOne({ _id: "admin" });
    if (!settings?.adminPasswordHash) {
      return false;
    }
    return bcrypt.compare(password, settings.adminPasswordHash);
  }
  // =========================
  // Products
  // =========================
  async getProducts() {
    const db3 = await getMongoDB();
    return db3.collection("products").find({}).toArray();
  }
  async getProductById(id) {
    const db3 = await getMongoDB();
    const product = await db3.collection("products").findOne({
      $or: [
        { id },
        { slug: id }
      ]
    });
    return product ?? void 0;
  }
  async createProduct(product) {
    const db3 = await getMongoDB();
    await db3.collection("products").insertOne(product);
    await this.updateCategoryCounts();
    return product;
  }
  async updateProduct(id, updates) {
    const db3 = await getMongoDB();
    const result = await db3.collection("products").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) {
      return null;
    }
    await this.updateCategoryCounts();
    return result;
  }
  async deleteProduct(id) {
    const db3 = await getMongoDB();
    const result = await db3.collection("products").deleteOne({
      id
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
  async getCategories() {
    await this.updateCategoryCounts();
    const db3 = await getMongoDB();
    return db3.collection("categories").find({}).toArray();
  }
  async createCategory(category) {
    const db3 = await getMongoDB();
    await db3.collection("categories").insertOne(category);
    return category;
  }
  async updateCategoryCounts() {
    const db3 = await getMongoDB();
    const products = await db3.collection("products").find({}).toArray();
    const categories = await db3.collection("categories").find({}).toArray();
    for (const category of categories) {
      const count = products.filter(
        (product) => product.category.toLowerCase() === category.name.toLowerCase()
      ).length;
      await db3.collection("categories").updateOne(
        { id: category.id },
        {
          $set: {
            itemCount: count
          }
        }
      );
    }
  }
  // =========================
  // Orders
  // =========================
  async getOrders() {
    const db3 = await getMongoDB();
    return db3.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
  }
  async getOrdersByCustomerEmail(email) {
    const db3 = await getMongoDB();
    return db3.collection("orders").find({
      $or: [
        {
          "customer.email": {
            $regex: `^${escapeRegex(email)}$`,
            $options: "i"
          }
        },
        {
          "deliveryAddress.email": {
            $regex: `^${escapeRegex(email)}$`,
            $options: "i"
          }
        }
      ]
    }).sort({ createdAt: -1 }).toArray();
  }
  async getOrderById(id) {
    const db3 = await getMongoDB();
    const order = await db3.collection("orders").findOne({
      $or: [
        { id },
        { orderNumber: { $regex: `^${escapeRegex(id)}$`, $options: "i" } }
      ]
    });
    return order ?? void 0;
  }
  async createOrder(order) {
    const db3 = await getMongoDB();
    for (const item of order.items) {
      await db3.collection("products").updateOne(
        { id: item.productId },
        {
          $inc: {
            stock: -item.quantity
          }
        }
      );
    }
    await db3.collection("orders").insertOne(order);
    const existingUser = await this.findUserByEmail(
      order.deliveryAddress.email
    );
    if (!existingUser) {
      const newUser = {
        id: `usr-${Date.now()}`,
        name: order.deliveryAddress.name,
        email: order.deliveryAddress.email,
        phone: order.deliveryAddress.phone,
        role: "customer",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.createUser(newUser);
    }
    return order;
  }
  async updateOrderStatus(id, status, note) {
    const db3 = await getMongoDB();
    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const timelineEntry = {
      status,
      timestamp: now,
      note: note || `Status updated to ${status}`
    };
    const update = {
      status,
      updatedAt: now
    };
    if (status === "Delivered") {
      update.paymentStatus = "Paid";
    }
    await db3.collection("orders").updateOne(
      { id: order.id },
      {
        $set: update,
        $push: {
          timeline: timelineEntry
        }
      }
    );
    return this.getOrderById(order.id).then((result) => result ?? null);
  }
  async cancelOrder(id, reason) {
    const db3 = await getMongoDB();
    const order = await this.getOrderById(id);
    if (!order) {
      return null;
    }
    if (order.status === "Cancelled") {
      return order;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db3.collection("orders").updateOne(
      { id: order.id },
      {
        $set: {
          status: "Cancelled",
          cancellationReason: reason,
          updatedAt: now
        },
        $push: {
          timeline: {
            status: "Cancelled",
            timestamp: now,
            note: `Cancelled: ${reason}`
          }
        }
      }
    );
    for (const item of order.items) {
      await db3.collection("products").updateOne(
        { id: item.productId },
        {
          $inc: {
            stock: item.quantity
          }
        }
      );
    }
    return this.getOrderById(order.id).then((result) => result ?? null);
  }
  // =========================
  // Reviews
  // =========================
  async getReviewsForProduct(productId) {
    const db3 = await getMongoDB();
    return db3.collection("reviews").find({ productId }).sort({ createdAt: -1 }).toArray();
  }
  async addReview(review) {
    const db3 = await getMongoDB();
    await db3.collection("reviews").insertOne(review);
    const productReviews = await db3.collection("reviews").find({ productId: review.productId }).toArray();
    const averageRating = productReviews.reduce((sum, item) => sum + item.rating, 0) / productReviews.length;
    await db3.collection("products").updateOne(
      { id: review.productId },
      {
        $set: {
          rating: Number(averageRating.toFixed(1)),
          reviewCount: productReviews.length
        }
      }
    );
    return review;
  }
  // =========================
  // Admin Stats
  // =========================
  async getStats() {
    const db3 = await getMongoDB();
    const orders = await db3.collection("orders").find({}).toArray();
    const products = await db3.collection("products").find({}).toArray();
    const users = await db3.collection("users").find({}).toArray();
    const totalSales = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = orders.filter(
      (order) => order.status === "Pending"
    ).length;
    const deliveredOrders = orders.filter(
      (order) => order.status === "Delivered"
    ).length;
    const lowStockProducts = products.filter(
      (product) => product.stock <= 20
    ).length;
    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: users.filter((user) => user.role === "customer").length,
      totalSales,
      pendingOrders,
      deliveredOrders,
      lowStockProducts
    };
  }
};
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var db2 = new Database();

// server.ts
dotenv.config();
var app = express();
var PORT = process.env.PORT || 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "vivepanya_ecommerce_secret_key_2026";
app.use(express.json());
var asyncHandler = (handler) => (req, res, next) => {
  void handler(req, res, next).catch(next);
};
var authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
};
var requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin privileges required" });
    }
    next();
  });
};
app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  const existing = await db2.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Account with this email already exists" });
  }
  const newUser = await db2.createUser({
    id: `usr-${Date.now()}`,
    name,
    email,
    phone: phone || "",
    role: "customer",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.status(201).json({ user: newUser, token });
}));
app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (email.toLowerCase() === "admin@vivepanya.com") {
    if (await db2.verifyAdminPassword(password)) {
      const token2 = jwt.sign(
        { id: "usr-admin", email: "admin@vivepanya.com", name: "VIVE Admin", role: "admin" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.json({
        user: {
          id: "usr-admin",
          name: "VIVE Admin",
          email: "admin@vivepanya.com",
          role: "admin",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        token: token2
      });
    } else {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }
  }
  const user = await db2.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "User account not found" });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ user, token });
}));
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
app.get("/api/products", asyncHandler(async (req, res) => {
  let products = await db2.getProducts();
  const { search, category, minPrice, maxPrice, minRating, sort } = req.query;
  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }
  if (category && typeof category === "string" && category !== "All") {
    products = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) {
      products = products.filter((p) => (p.discountPrice || p.price) >= min);
    }
  }
  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) {
      products = products.filter((p) => (p.discountPrice || p.price) <= max);
    }
  }
  if (minRating) {
    const r = Number(minRating);
    if (!isNaN(r)) {
      products = products.filter((p) => p.rating >= r);
    }
  }
  if (sort === "price-low") {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sort === "price-high") {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sort === "rating") {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sort === "newest") {
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }
  res.json(products);
}));
app.get("/api/products/:id", asyncHandler(async (req, res) => {
  const product = await db2.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
}));
app.post("/api/products", requireAdmin, asyncHandler(async (req, res) => {
  const { name, category, price, discountPrice, description, stock, images, benefits, ingredients, weight } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: "Product name, category and price are required" });
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const newProduct = {
    id: `prod-${Date.now()}`,
    name,
    slug,
    category,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : void 0,
    description: description || "",
    benefits: Array.isArray(benefits) ? benefits : [],
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    stock: Number(stock) || 0,
    images: images && images.length ? images : ["/src/assets/images/product_neem_tulsi_soap_1790230422423.jpg"],
    rating: 5,
    reviewCount: 0,
    weight: weight || "125g",
    isFeatured: req.body.isFeatured || false,
    isBestSeller: req.body.isBestSeller || false,
    isNewArrival: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const created = await db2.createProduct(newProduct);
  res.status(201).json(created);
}));
app.put("/api/products/:id", requireAdmin, asyncHandler(async (req, res) => {
  const updated = await db2.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(updated);
}));
app.delete("/api/products/:id", requireAdmin, asyncHandler(async (req, res) => {
  const deleted = await db2.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ success: true, message: "Product removed" });
}));
app.get("/api/categories", asyncHandler(async (_req, res) => {
  const categories = await db2.getCategories();
  res.json(categories);
}));
app.post("/api/categories", requireAdmin, asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required" });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const cat = {
    id: `cat-${Date.now()}`,
    name,
    slug,
    description: description || "",
    image: image || "/src/assets/images/product_neem_tulsi_soap_1790230422423.jpg",
    itemCount: 0
  };
  const created = await db2.createCategory(cat);
  res.status(201).json(created);
}));
app.post("/api/orders", asyncHandler(async (req, res) => {
  const { customer, deliveryAddress, items, subtotal, deliveryCharges, discount, total, paymentMethod, couponCode } = req.body;
  if (!items || !items.length || !deliveryAddress) {
    return res.status(400).json({ error: "Items and delivery address are required" });
  }
  const orderNumber = `VP-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(1e3 + Math.random() * 9e3)}`;
  const orderId = `ord-${Date.now()}`;
  const newOrder = {
    id: orderId,
    orderNumber,
    customer: {
      userId: customer?.userId,
      name: deliveryAddress.name,
      email: deliveryAddress.email,
      phone: deliveryAddress.phone
    },
    deliveryAddress,
    items,
    subtotal: Number(subtotal),
    deliveryCharges: Number(deliveryCharges) || 0,
    discount: Number(discount) || 0,
    total: Number(total),
    couponCode,
    paymentMethod: paymentMethod === "Online Payment" ? "Online Payment" : "Cash on Delivery",
    paymentStatus: paymentMethod === "Online Payment" ? "Paid" : "Pending",
    status: "Pending",
    timeline: [
      {
        status: "Pending",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: `Order placed via ${paymentMethod}`
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const savedOrder = await db2.createOrder(newOrder);
  res.status(201).json(savedOrder);
}));
app.get("/api/orders", asyncHandler(async (req, res) => {
  const { email, admin } = req.query;
  if (admin === "true") {
    return res.json(await db2.getOrders());
  }
  if (email && typeof email === "string") {
    return res.json(await db2.getOrdersByCustomerEmail(email));
  }
  res.json(await db2.getOrders());
}));
app.get("/api/orders/:id", asyncHandler(async (req, res) => {
  const order = await db2.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
}));
app.put("/api/orders/:id/status", requireAdmin, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });
  const updated = await db2.updateOrderStatus(req.params.id, status, note);
  if (!updated) return res.status(404).json({ error: "Order not found" });
  res.json(updated);
}));
app.put("/api/orders/:id/cancel", asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const cancelled = await db2.cancelOrder(req.params.id, reason || "Cancelled by customer");
  if (!cancelled) return res.status(404).json({ error: "Order not found" });
  res.json(cancelled);
}));
app.get("/api/reviews/:productId", asyncHandler(async (req, res) => {
  res.json(await db2.getReviewsForProduct(req.params.productId));
}));
app.post("/api/reviews", asyncHandler(async (req, res) => {
  const { productId, customerName, customerEmail, rating, comment } = req.body;
  if (!productId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: "Product, customer name, rating, and comment are required" });
  }
  const review = {
    id: `rev-${Date.now()}`,
    productId,
    customerName,
    customerEmail: customerEmail || "",
    rating: Number(rating),
    comment,
    verifiedPurchase: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saved = await db2.addReview(review);
  res.status(201).json(saved);
}));
app.get("/api/admin/stats", requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await db2.getStats());
}));
app.get("/api/admin/customers", asyncHandler(async (req, res) => {
  const users = (await db2.getUsers()).filter((u) => u.role === "customer");
  const orders = await db2.getOrders();
  const customerList = users.map((user) => {
    const userOrders = orders.filter((o) => o.customer.email.toLowerCase() === user.email.toLowerCase());
    const totalSpent = userOrders.reduce((acc, o) => acc + o.total, 0);
    return {
      ...user,
      orderCount: userOrders.length,
      totalSpent,
      lastOrderDate: userOrders[0]?.createdAt
    };
  });
  res.json(customerList);
}));
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.use((error, _req, res, _next) => {
    console.error("\u274C Request failed:", error);
    if (res.headersSent) {
      return;
    }
    const databaseUnavailable = error instanceof Error && ["MongoNetworkError", "MongoServerSelectionError"].includes(error.name);
    res.status(databaseUnavailable ? 503 : 500).json({
      error: databaseUnavailable ? "Database is currently unavailable" : "Internal server error"
    });
  });
  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`\u{1F680} VIVEPANYA E-Mart Server running on http://0.0.0.0:${PORT}`);
      resolve();
    });
    server.once("error", reject);
  });
}
startServer().then(() => {
  void connectMongoDB().catch((error) => {
    console.error(
      "\u274C MongoDB connection failed; database-backed API requests will remain unavailable until MongoDB is reachable:",
      error
    );
  });
}).catch((error) => {
  console.error("\u274C Server startup failed:", error);
  process.exitCode = 1;
});
