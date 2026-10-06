# CodeAlpha_EcommerceStore — NovaCart

> **CodeAlpha Full Stack Web Development Internship — Task 1: Simple E-Commerce Store**  
> A production-grade, full-stack e-commerce web application engineered with Vanilla HTML5, CSS3, JavaScript, Node.js, Express.js, and SQLite.

---

## 🌟 Project Overview

**NovaCart** is a modern, responsive full-stack e-commerce store built to demonstrate authentic client-server architecture, database transactions, session-based authentication, and secure server-authoritative calculations.

No fake mockups. No hardcoded prices in the frontend. All product inventory, shopping cart totals, user sessions, and order records are managed through a persistent SQLite database.

---

## ✨ Features

### 🛒 Product Catalog & Discovery
- **Dynamic Catalog:** Grid layout displaying 12 seeded consumer electronics and productivity lifestyle items.
- **Real-Time Search:** Instant client-side search across titles and descriptions with debounce.
- **Category Filtering:** Filter by `Audio`, `Wearables`, `Computers`, `Accessories`, and `Home & Office`.
- **Sorting Options:** Sort products by price (low-to-high, high-to-low), customer rating, and alphabetical name.
- **Dedicated Product Page:** Detailed gallery view with product specifications, dynamic stock badge, quantity controls, and related products.

### 🛍️ Shopping Cart Management
- **Add / Remove Items:** Live stock boundary enforcement prevents adding more items than available in inventory.
- **Quantity Adjustment:** Increment and decrement controls with server verification.
- **Server-Side Pricing:** Subtotals, estimated tax (8%), and dynamic free shipping (unlocked over $75) calculated by the backend.
- **Empty State UX:** Informative empty-state screen with a call-to-action to explore the catalog.

### 🔐 User Authentication & Security
- **Registration:** Full name, email format validation, duplicate email protection, and password confirmation.
- **Password Security:** Salted password hashing powered by `bcryptjs` (passwords are never saved in plain text).
- **Session Authentication:** Express session management coupled with Bearer token fallback for iframe compatibility.
- **Protected Endpoints:** Unauthorized access attempts return HTTP 401.

### 📦 Checkout & Order Processing
- **Customer Information:** Form for recipient name, email, phone, street address, city, and postal code.
- **Server-Authoritative Orders:** The server queries SQLite for current product prices and calculates the true order total, discarding any manipulated client prices.
- **Stock Depletion & Database Transactions:** Orders are wrapped in SQLite database transactions (`BEGIN TRANSACTION` -> `INSERT` order -> `INSERT` items -> `UPDATE` stock -> `COMMIT`), ensuring atomic inventory decrements.
- **Order Confirmation:** Instant receipt screen displaying unique order number (e.g. `NC-2026-XXXX`), shipping breakdown, and purchased items.
- **Order History:** Authenticated customers can view all their past orders with timestamped statuses (`Processing`, `Shipped`, `Delivered`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Flexbox/Grid, CSS Variables), Vanilla JavaScript (ES Modules) |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (Pure WASM engine with binary file persistence to `data/ecommerce.db`) |
| **Authentication** | Express Session + Token Authorization |
| **Password Security** | Bcrypt / BcryptJS |
| **Architecture** | RESTful JSON APIs, Client-Server Separation |

---

## 📁 Project Structure

```
CodeAlpha_EcommerceStore/
│
├── server.js               # Main Express.js server & API router mounting
├── server.ts               # TypeScript development entry point
├── package.json            # Node.js dependencies and operational scripts
├── .env.example            # Environment variables template
├── .gitignore              # Files ignored by git (node_modules, data/*.db)
├── README.md               # Complete project documentation & guide
│
├── database/
│   ├── database.js         # SQLite database connection & transactional query wrapper
│   ├── schema.sql          # SQL table definitions (users, products, orders, order_items, sessions)
│   └── seed.js             # 12 realistic starter products & default test customer
│
├── routes/
│   ├── auth.js             # Authentication routes (register, login, logout, me)
│   ├── products.js         # Product catalog, categories, search, and detail endpoints
│   ├── cart.js             # Shopping cart add, update, remove, and calculate routes
│   └── orders.js           # Order creation with stock decrement & user order history
│
├── middleware/
│   └── auth.js             # Session & token verification guard middleware
│
├── public/                 # Static frontend served directly by Express
│   ├── index.html          # Homepage & product catalog
│   ├── product.html        # Product details view
│   ├── cart.html           # Interactive shopping cart
│   ├── checkout.html       # Checkout & delivery form
│   ├── confirmation.html   # Order success receipt
│   ├── orders.html         # User account past orders
│   ├── login.html          # User login
│   ├── register.html       # User registration
│   │
│   ├── css/
│   │   └── style.css       # Professional responsive stylesheet
│   │
│   └── js/
│       ├── api.js          # Shared HTTP client, toasts, and navbar auth sync
│       ├── products.js     # Catalog rendering, category filters, and search logic
│       ├── cart.js         # Cart quantity increments, decrements, and removals
│       ├── checkout.js     # Checkout validation and order placement
│       ├── auth.js         # Login & register form submissions
│       └── orders.js       # Order history & confirmation receipt rendering
│
└── data/
    └── ecommerce.db        # SQLite database binary storage
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/YourUsername/CodeAlpha_EcommerceStore.git
cd CodeAlpha_EcommerceStore
npm install
```

### 2. Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

### 3. Database Initialization & Seeding
Initialize the SQLite database with tables and 12 starter products:
```bash
npm run seed
```

*(Note: `server.js` also automatically checks and seeds the database on initial boot if empty!)*

### 4. Running the Application
Start the Node/Express server:
```bash
npm start
```
Or for local development:
```bash
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🔑 Test User Credentials

For instant evaluation, you can use the pre-seeded account or click the **"Auto-Fill"** button on the Login page:

- **Email:** `test@example.com`
- **Password:** `Password123!`
- **Name:** Alex Johnson

---

## 📡 RESTful API Documentation

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Query products with optional `search`, `category`, and `sort` |
| `GET` | `/api/products/categories` | Retrieve array of unique product categories |
| `GET` | `/api/products/:id` | Retrieve single product details & related products |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Authenticate user credentials & create session |
| `POST` | `/api/auth/logout` | Invalidate active session |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile |

### Shopping Cart
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cart` | Get verified cart items with live database prices & stock |
| `POST` | `/api/cart` | Add product to cart (`productId`, `quantity`) |
| `PUT` | `/api/cart/:productId` | Update item quantity (capped at product stock) |
| `DELETE` | `/api/cart/:productId` | Remove product from cart |
| `DELETE` | `/api/cart` | Clear entire shopping cart |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Place order, decrement stock in transaction, clear cart |
| `GET` | `/api/orders` | Get past orders for authenticated user (Protected) |
| `GET` | `/api/orders/:id` | Get order details by ID or order number |

---

## 🧪 Testing Checklist

Follow this checklist to verify all requirements:
1. [x] **Catalog Browsing:** Open `/index.html` — verify 12 products render with prices, categories, and stock status.
2. [x] **Search & Filter:** Search for "Audio" or "Wireless", select categories — verify dynamic filtering.
3. [x] **Product Details:** Click any product card — verify specifications, gallery, stock, and quantity selector.
4. [x] **Shopping Cart:** Add products to cart — verify navbar badge updates, subtotal changes, and free shipping progress bar moves.
5. [x] **Stock Protection:** Try increasing item quantity beyond available stock — verify stock limit alert prevents invalid order.
6. [x] **User Registration:** Navigate to `/register.html` — register a new user and verify duplicate email validation.
7. [x] **User Login:** Navigate to `/login.html` — sign in with `test@example.com` / `Password123!` or newly created account.
8. [x] **Checkout:** Proceed to `/checkout.html` — customer details are pre-filled, order totals are verified by backend.
9. [x] **Order Creation:** Click "Place Order Now" — verify transaction commits to SQLite, cart is emptied, and order confirmation receipt renders.
10. [x] **Order History:** Click "Orders" in the navbar — verify the newly created order appears with itemized breakdown and status.

---

## 🔮 Future Enhancements
- Integration with Stripe payment gateway (test mode).
- Admin dashboard to add, edit, and delete products and restock inventory.
- Automated email order confirmations via Nodemailer.
- Customer reviews submission and star-rating calculations.

---

## 📄 License
This project was developed by a BSCS student as part of the **CodeAlpha Full Stack Web Development Internship**.
Licensed under the [MIT License](LICENSE).
