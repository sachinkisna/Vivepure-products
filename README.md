# VIVEPANYA E-Mart — Modern E-Commerce Platform

VIVEPANYA E-mart Private Ltd. is a modern full-stack e-commerce web application for handcrafted herbal soaps, cold-pressed virgin coconut oil, and personal care wellness products.

---

## 1. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Context API
- **Backend:** Node.js, Express.js REST API
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs password hashing
- **Database:** MongoDB / MongoDB Atlas via `MONGODB_URI`
- **Architecture:** Unified Express server with Vite middleware in development and static asset serving in production.

---

## 2. Accounts

Customers create accounts through the registration form. Admin authentication uses the administrator email and bcrypt password hash stored in MongoDB; no demo credentials are shipped in the client.

---

## 3. Step-by-Step Setup Instructions

### Step 1: Install Dependencies
In the root directory of the project, execute:
```bash
npm install
```

### Step 2: Configure Environment & MongoDB
Copy the example environment configuration:
```bash
cp .env.example .env
```
In `.env`, configure your settings:
```env
PORT=3000
JWT_SECRET=<generate-a-private-random-secret-of-at-least-32-bytes>
ADMIN_EMAIL=<administrator-email-used-during-migration>
ADMIN_PASSWORD=<new-unique-administrator-password-used-during-migration>

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/vivepanya?retryWrites=true&w=majority
```
Keep all server configuration out of `VITE_*` variables. Use a private random `JWT_SECRET`; never copy a sample value into production. Use `npm run configure:admin` to store `ADMIN_EMAIL` and a bcrypt hash of `ADMIN_PASSWORD` in the existing MongoDB settings record. This updates only administrator settings and does not replace store data. Unset `ADMIN_PASSWORD` after configuration. Do not use the legacy data migration against a populated database.

#### Running MongoDB Locally (Optional)
If you prefer running a local MongoDB instance with Docker:
```bash
docker run -d -p 27017:27017 --name mongodb-vivepanya mongo:latest
```
For transactional order stock updates, configure the local server as a replica set and use `MONGODB_URI="mongodb://localhost:27017/vivepanya?replicaSet=rs0"` in your `.env`.

### Step 3: Run the Complete Application (Dev Server)
To start both the backend API and frontend Vite server together:
```bash
npm run dev
```
Open your browser at:
```
http://localhost:3000
```

### Step 4: Build for Production Deployment
To generate production builds:
```bash
# 1. Build the frontend client bundle into /dist
npm run build

# 2. Run the production server
npm run start
```

---

## 4. REST API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new customer
- `POST /api/auth/login` — Login and receive JWT token

### Products
- `GET /api/products` — Retrieve all products (Supports queries: `search`, `category`, `minPrice`, `maxPrice`, `minRating`, `sort`)
- `GET /api/products/:id` — Retrieve single product details
- `POST /api/products` — (Admin) Add new product
- `PUT /api/products/:id` — (Admin) Update product details or stock
- `DELETE /api/products/:id` — (Admin) Delete a product

### Categories
- `GET /api/categories` — Retrieve all collections
- `POST /api/categories` — (Admin) Create category

### Orders
- `POST /api/orders` — Place an authenticated order; server validates products, stock, and totals
- `GET /api/orders` — Retrieve the authenticated customer's orders or all orders for an admin
- `GET /api/orders/:id` — Retrieve an owned order or an order for an authenticated admin
- `PUT /api/orders/:id/status` — (Admin) Advance order status (`Pending` -> `Confirmed` -> `Packed` -> `Shipped` -> `Out for Delivery` -> `Delivered`)
- `PUT /api/orders/:id/cancel` — Cancel an owned, eligible order or an admin-managed order

### Reviews
- `GET /api/reviews/:productId` — Fetch reviews for product
- `POST /api/reviews` — Submit an authenticated customer review; purchase status is checked server-side

### Admin Analytics
- `GET /api/admin/stats` — Summary metrics (Sales, Orders, Users, Low Stock)
- `GET /api/admin/customers` — List registered customers

Online payment is not integrated. Online orders remain unpaid until a real server-side payment provider integration verifies them; the application does not claim to verify or refund payments.

---

## 5. Discount Coupons
Try these test coupons during checkout:
- `VIVE10`: 10% discount on any order
- `WELCOME20`: 20% discount on order
- `FLAT100`: ₹100 flat discount on orders over ₹500
