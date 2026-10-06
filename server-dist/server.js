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
  await db.collection("users").createIndex(
    { email: 1 },
    {
      unique: true,
      collation: { locale: "en", strength: 2 },
      name: "users_email_case_insensitive_unique"
    }
  );
  console.log("\u2705 Connected to MongoDB Atlas");
  return db;
}
async function getMongoDB() {
  if (db) {
    return db;
  }
  return connectMongoDB();
}
function getMongoClient() {
  return client;
}

// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt2 from "bcryptjs";
import { randomUUID } from "node:crypto";

// src/server/db.ts
import bcrypt from "bcryptjs";
var EMAIL_COLLATION = { locale: "en", strength: 2 };
var InsufficientStockError = class extends Error {
  constructor() {
    super("One or more products are unavailable or have insufficient stock.");
    this.name = "InsufficientStockError";
  }
};
var Database = class {
  // =========================
  // Users & Auth
  // =========================
  async getUsers() {
    const db3 = await getMongoDB();
    return db3.collection("users").find({}, { projection: { passwordHash: 0 } }).toArray();
  }
  async findUserByEmail(email) {
    const db3 = await getMongoDB();
    const user = await db3.collection("users").findOne(
      { email: email.trim().toLowerCase() },
      { collation: EMAIL_COLLATION }
    );
    return user ?? void 0;
  }
  async findUserById(id) {
    const db3 = await getMongoDB();
    const user = await db3.collection("users").findOne({ id });
    return user ?? void 0;
  }
  async createUser(user) {
    const db3 = await getMongoDB();
    await db3.collection("users").insertOne(user);
    return this.toPublicUser(user);
  }
  async verifyAdminCredentials(email, password) {
    const db3 = await getMongoDB();
    const settings = await db3.collection(
      "settings"
    ).findOne({ _id: "admin" });
    if (!settings?.adminEmail || settings.adminEmail.trim().toLowerCase() !== email.trim().toLowerCase() || !settings.adminPasswordHash) {
      return false;
    }
    return bcrypt.compare(password, settings.adminPasswordHash);
  }
  async isAdminIdentity(id, email) {
    if (id !== "admin") return false;
    const db3 = await getMongoDB();
    const settings = await db3.collection("settings").findOne({ _id: "admin" });
    return Boolean(
      settings?.adminEmail && settings.adminPasswordHash && settings.adminEmail.trim().toLowerCase() === email.trim().toLowerCase()
    );
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
  async getOrdersForCustomer(userId, email) {
    const db3 = await getMongoDB();
    const normalizedEmail = email.trim().toLowerCase();
    return db3.collection("orders").find({
      $or: [
        { "customer.userId": userId },
        { "customer.email": normalizedEmail }
      ]
    }).sort({ createdAt: -1 }).collation(EMAIL_COLLATION).toArray();
  }
  async getOrderById(id) {
    const db3 = await getMongoDB();
    const order = await db3.collection("orders").findOne({
      $or: [
        { id },
        { orderNumber: id }
      ]
    });
    return order ?? void 0;
  }
  async createOrder(order) {
    const db3 = await getMongoDB();
    const session = getMongoClient().startSession();
    try {
      await session.withTransaction(async () => {
        for (const item of order.items) {
          const result = await db3.collection("products").updateOne(
            { id: item.productId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          );
          if (result.matchedCount !== 1) {
            throw new InsufficientStockError();
          }
        }
        await db3.collection("orders").insertOne(order, { session });
      });
    } finally {
      await session.endSession();
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
    const session = getMongoClient().startSession();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let cancelled = false;
    try {
      await session.withTransaction(async () => {
        cancelled = false;
        const order = await db3.collection("orders").findOne(
          { $or: [{ id }, { orderNumber: id }] },
          { session }
        );
        if (!order || order.status === "Cancelled") return;
        if (order.status !== "Pending" && order.status !== "Confirmed") return;
        const result = await db3.collection("orders").updateOne(
          { id: order.id, status: { $in: ["Pending", "Confirmed"] } },
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
          },
          { session }
        );
        if (result.modifiedCount !== 1) return;
        for (const item of order.items) {
          await db3.collection("products").updateOne(
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
  async hasVerifiedPurchase(userId, email, productId) {
    const db3 = await getMongoDB();
    const order = await db3.collection("orders").findOne({
      status: "Delivered",
      "items.productId": productId,
      $or: [
        { "customer.userId": userId },
        { "customer.email": email.trim().toLowerCase() }
      ]
    }, { collation: EMAIL_COLLATION });
    return Boolean(order);
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
    const totalSales = orders.filter((order) => order.paymentStatus === "Paid" && order.status !== "Cancelled").reduce((sum, order) => sum + order.total, 0);
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
  toPublicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };
  }
};
var db2 = new Database();

// server.ts
dotenv.config();
var app = express();
var PORT = process.env.PORT || 3e3;
var JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, "utf8") < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 random bytes.");
}
app.use(express.json());
var asyncHandler = (handler) => (req, res, next) => {
  void handler(req, res, next).catch(next);
};
var requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const match = typeof authorization === "string" ? authorization.match(/^Bearer\s+([^\s]+)$/i) : null;
  if (!match) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = match[1];
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  let subject;
  let tokenEmail;
  try {
    const verified = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof verified === "string") {
      return res.status(401).json({ error: "Invalid or expired authentication" });
    }
    if (typeof verified.sub !== "string" || typeof verified.email !== "string") {
      return res.status(401).json({ error: "Invalid or expired authentication" });
    }
    subject = verified.sub;
    tokenEmail = verified.email;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid or expired authentication" });
    }
    throw error;
  }
  let authenticatedUser;
  if (subject === "admin" && await db2.isAdminIdentity(subject, tokenEmail)) {
    authenticatedUser = {
      id: "admin",
      email: tokenEmail,
      role: "admin",
      name: "VIVE Admin",
      createdAt: ""
    };
  } else {
    const user = await db2.findUserById(subject);
    if (!user || user.role !== "customer" || user.email.toLowerCase() !== tokenEmail.toLowerCase()) {
      return res.status(401).json({ error: "Invalid or expired authentication" });
    }
    authenticatedUser = {
      id: user.id,
      email: user.email,
      role: "customer",
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt
    };
  }
  req.user = authenticatedUser;
  next();
});
var requireAdmin = [
  requireAuth,
  (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin privileges required" });
    }
    next();
  }
];
var requireCustomer = [
  requireAuth,
  (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (user.role !== "customer") {
      return res.status(403).json({ error: "Customer account required" });
    }
    next();
  }
];
var publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt
});
var makeToken = (user) => jwt.sign(
  { email: user.email, role: user.role },
  JWT_SECRET,
  { subject: user.id, expiresIn: "7d", algorithm: "HS256" }
);
var isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
var isValidPassword = (password) => {
  const byteLength = Buffer.byteLength(password, "utf8");
  return password.length >= 8 && byteLength <= 72;
};
app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100 || typeof email !== "string" || !isValidEmail(email.trim()) || typeof password !== "string" || !isValidPassword(password) || phone !== void 0 && (typeof phone !== "string" || phone.length > 30)) {
    return res.status(400).json({ error: "Enter a valid name, email, password, and phone number." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db2.findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }
  const passwordHash = await bcrypt2.hash(password, 12);
  const user = {
    id: `usr-${randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    phone: typeof phone === "string" ? phone.trim() : "",
    role: "customer",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    passwordHash
  };
  try {
    const createdUser = await db2.createUser(user);
    res.status(201).json({ user: publicUser(createdUser), token: makeToken(createdUser) });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11e3) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    throw error;
  }
}));
app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !isValidEmail(email.trim()) || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Enter a valid email and password." });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await db2.verifyAdminCredentials(normalizedEmail, password)) {
    const admin = {
      id: "admin",
      email: normalizedEmail,
      name: "VIVE Admin",
      role: "admin",
      createdAt: ""
    };
    return res.json({ user: publicUser(admin), token: makeToken(admin) });
  }
  const user = await db2.findUserByEmail(normalizedEmail);
  if (!user?.passwordHash || !await bcrypt2.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }
  const safeUser = publicUser(user);
  res.json({ user: safeUser, token: makeToken(safeUser) });
}));
app.get("/api/auth/me", requireAuth, (req, res) => {
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
app.post("/api/orders", requireCustomer, asyncHandler(async (req, res) => {
  const user = req.user;
  const body = req.body ?? {};
  const deliveryAddress = body.deliveryAddress;
  const requestedItems = body.items;
  if (!deliveryAddress || typeof deliveryAddress !== "object" || ["name", "phone", "email", "address", "city", "state", "pincode"].some(
    (field) => typeof deliveryAddress[field] !== "string" || !deliveryAddress[field].trim()
  ) || !isValidEmail(deliveryAddress.email.trim()) || !Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 20) {
    return res.status(400).json({ error: "Valid delivery details and order items are required." });
  }
  const quantities = /* @__PURE__ */ new Map();
  for (const item of requestedItems) {
    if (!item || typeof item.productId !== "string" || !item.productId.trim() || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      return res.status(400).json({ error: "Each order item must have a valid product and quantity." });
    }
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > 100) {
      return res.status(400).json({ error: "The quantity for each product cannot exceed 100." });
    }
    quantities.set(item.productId, quantity);
  }
  if (body.paymentMethod !== "Cash on Delivery" && body.paymentMethod !== "Online Payment") {
    return res.status(400).json({ error: "Choose a supported payment method." });
  }
  const orderItems = [];
  let subtotal = 0;
  for (const [productId, quantity] of quantities) {
    const product = await db2.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "One or more products could not be found." });
    }
    if (product.stock < quantity) {
      return res.status(409).json({ error: `Insufficient stock for ${product.name}.` });
    }
    const price = product.discountPrice ?? product.price;
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("Product has invalid pricing data.");
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      image: product.images[0] ?? ""
    });
    subtotal += price * quantity;
  }
  const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : void 0;
  let discount = 0;
  if (couponCode === "VIVE10") {
    discount = Math.round(subtotal * 0.1);
  } else if (couponCode === "WELCOME20") {
    discount = Math.round(subtotal * 0.2);
  } else if (couponCode === "FLAT100" && subtotal >= 500) {
    discount = 100;
  } else if (couponCode) {
    return res.status(400).json({ error: "The coupon code is invalid or does not meet its requirements." });
  }
  const deliveryCharges = subtotal > 499 ? 0 : 50;
  const total = Math.max(0, subtotal + deliveryCharges - discount);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const orderNumber = `VP-${(/* @__PURE__ */ new Date()).getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const normalizedDeliveryAddress = {
    name: deliveryAddress.name.trim(),
    phone: deliveryAddress.phone.trim(),
    email: deliveryAddress.email.trim().toLowerCase(),
    address: deliveryAddress.address.trim(),
    city: deliveryAddress.city.trim(),
    state: deliveryAddress.state.trim(),
    pincode: deliveryAddress.pincode.trim()
  };
  const newOrder = {
    id: `ord-${randomUUID()}`,
    orderNumber,
    customer: {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || normalizedDeliveryAddress.phone
    },
    deliveryAddress: normalizedDeliveryAddress,
    items: orderItems,
    subtotal,
    deliveryCharges,
    discount,
    total,
    couponCode,
    paymentMethod: body.paymentMethod,
    paymentStatus: "Pending",
    status: "Pending",
    timeline: [
      {
        status: "Pending",
        timestamp: now,
        note: body.paymentMethod === "Online Payment" ? "Order placed; payment is pending server-side verification." : "Order placed with cash on delivery."
      }
    ],
    createdAt: now,
    updatedAt: now
  };
  try {
    res.status(201).json(await db2.createOrder(newOrder));
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ error: "One or more products are no longer available in the requested quantity." });
    }
    throw error;
  }
}));
app.get("/api/orders", requireAuth, asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.role === "admin") {
    return res.json(await db2.getOrders());
  }
  res.json(await db2.getOrdersForCustomer(user.id, user.email));
}));
app.get("/api/orders/:id", requireAuth, asyncHandler(async (req, res) => {
  const user = req.user;
  const order = await db2.getOrderById(req.params.id);
  if (!order || user.role !== "admin" && order.customer.userId !== user.id && (order.customer.email || "").toLowerCase() !== user.email.toLowerCase()) {
    return res.status(404).json({ error: "Order not found." });
  }
  res.json(order);
}));
app.put("/api/orders/:id/status", requireAdmin, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered"
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "A valid order status is required." });
  }
  const updated = await db2.updateOrderStatus(
    req.params.id,
    status,
    typeof note === "string" ? note.slice(0, 500) : void 0
  );
  if (!updated) return res.status(404).json({ error: "Order not found." });
  res.json(updated);
}));
app.put("/api/orders/:id/cancel", requireAuth, asyncHandler(async (req, res) => {
  const user = req.user;
  const existing = await db2.getOrderById(req.params.id);
  if (!existing || user.role !== "admin" && existing.customer.userId !== user.id && (existing.customer.email || "").toLowerCase() !== user.email.toLowerCase()) {
    return res.status(404).json({ error: "Order not found." });
  }
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
  const result = await db2.cancelOrder(req.params.id, reason || "Cancelled by customer");
  if (!result.order) return res.status(404).json({ error: "Order not found." });
  if (!result.cancelled && result.order.status !== "Cancelled") {
    return res.status(409).json({ error: "This order is no longer eligible for cancellation." });
  }
  res.json(result.order);
}));
app.get("/api/reviews/:productId", asyncHandler(async (req, res) => {
  res.json(await db2.getReviewsForProduct(req.params.productId));
}));
app.post("/api/reviews", requireCustomer, asyncHandler(async (req, res) => {
  const user = req.user;
  const { productId, rating, comment } = req.body ?? {};
  if (typeof productId !== "string" || !productId.trim() || !Number.isInteger(rating) || rating < 1 || rating > 5 || typeof comment !== "string" || !comment.trim() || comment.trim().length > 2e3) {
    return res.status(400).json({ error: "A valid product, rating, and review comment are required." });
  }
  if (!await db2.getProductById(productId)) {
    return res.status(404).json({ error: "Product not found." });
  }
  const review = {
    id: `rev-${randomUUID()}`,
    productId,
    customerName: user.name,
    customerEmail: user.email,
    rating,
    comment: comment.trim(),
    verifiedPurchase: await db2.hasVerifiedPurchase(user.id, user.email, productId),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saved = await db2.addReview(review);
  res.status(201).json(saved);
}));
app.get("/api/admin/stats", requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await db2.getStats());
}));
app.get("/api/admin/customers", requireAdmin, asyncHandler(async (_req, res) => {
  const users = (await db2.getUsers()).filter((u) => u.role === "customer");
  const orders = await db2.getOrders();
  const customerList = users.map((user) => {
    const userOrders = orders.filter((o) => o.customer.email.toLowerCase() === user.email.toLowerCase());
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
    console.error("\u274C Request failed:", error instanceof Error ? error.name : "Unknown error");
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
  void connectMongoDB().catch(() => {
    console.error("\u274C MongoDB connection failed; database-backed API requests will remain unavailable.");
  });
}).catch((error) => {
  console.error("\u274C Server startup failed:", error instanceof Error ? error.name : "Unknown error");
  process.exitCode = 1;
});
