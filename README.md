# NovaCart — Full-Stack E-Commerce Store

A full-stack e-commerce web application built for the **CodeAlpha Full Stack Web Development Internship — Task 1**.

NovaCart demonstrates a complete client-server shopping flow including product browsing, search and filtering, authentication, cart management, server-side price calculation, checkout, stock validation, and order history.

## Highlights

* Responsive e-commerce UI
* Dynamic product catalog
* Product search
* Category filtering
* Product sorting
* Product detail pages
* Stock indicators
* User registration and login
* Password hashing with `bcryptjs`
* Express sessions with token authentication fallback
* Shopping cart with quantity and stock validation
* Server-authoritative price calculations
* 8% tax calculation
* Free shipping threshold
* Checkout and order confirmation
* Persistent SQLite database
* Transaction-based order creation and stock deduction
* Authenticated order history
* REST API architecture

## Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript (ES Modules)
* TypeScript
* Vite

### Backend

* Node.js
* Express.js

### Database

* SQLite
* `sql.js` (WebAssembly SQLite)

### Authentication & Security

* Express Session
* Bearer-token fallback
* bcrypt password hashing

## Project Architecture

```text
NovaCart/
│
├── server.js
├── server.ts
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── README.md
├── .gitignore
│
├── database/
│   ├── database.js
│   ├── schema.sql
│   └── seed.js
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   └── orders.js
│
├── src/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
└── public/
    ├── index.html
    ├── product.html
    ├── cart.html
    ├── checkout.html
    ├── confirmation.html
    ├── orders.html
    ├── login.html
    ├── register.html
    │
    ├── css/
    │   └── style.css
    │
    └── js/
        ├── api.js
        ├── products.js
        ├── cart.js
        ├── checkout.js
        ├── auth.js
        └── orders.js
```

## API Overview

### Products

| Method | Endpoint                   | Purpose                                |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/api/products`            | List, search, filter and sort products |
| GET    | `/api/products/categories` | Get product categories                 |
| GET    | `/api/products/:id`        | Get product details                    |

### Authentication

| Method | Endpoint             | Purpose          |
| ------ | -------------------- | ---------------- |
| POST   | `/api/auth/register` | Create account   |
| POST   | `/api/auth/login`    | Login            |
| POST   | `/api/auth/logout`   | Logout           |
| GET    | `/api/auth/me`       | Get current user |

### Cart

| Method | Endpoint               | Purpose           |
| ------ | ---------------------- | ----------------- |
| GET    | `/api/cart`            | Get verified cart |
| POST   | `/api/cart`            | Add product       |
| PUT    | `/api/cart/:productId` | Update quantity   |
| DELETE | `/api/cart/:productId` | Remove item       |
| DELETE | `/api/cart`            | Clear cart        |

### Orders

| Method | Endpoint          | Purpose                  |
| ------ | ----------------- | ------------------------ |
| POST   | `/api/orders`     | Create order             |
| GET    | `/api/orders`     | Get user's order history |
| GET    | `/api/orders/:id` | Get order details        |

## Important Backend Logic
