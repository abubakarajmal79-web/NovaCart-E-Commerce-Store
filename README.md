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

One of the main goals of NovaCart is to avoid trusting prices supplied by the browser.

During checkout, the server:

1. Reads the product IDs and quantities.
2. Queries the current product prices from SQLite.
3. Verifies available stock.
4. Recalculates the subtotal.
5. Calculates tax and shipping.
6. Creates the order.
7. Creates order-item records.
8. Decrements inventory.
9. Commits the database transaction.

This makes the checkout process more reliable than a frontend-only shopping cart because important calculations and validation are performed on the server.

## Run Locally

### Requirements

* Node.js 18+
* npm 9+

### Installation

Clone the repository:

```bash
git clone https://github.com/abubakarajmal79-web/NovaCart-E-Commerce-Store.git
cd NovaCart-E-Commerce-Store
npm install
```

### Database Setup

The repository includes the database schema and seed scripts.

Run:

```bash
npm run seed
```

This initializes the SQLite database and inserts the starter data.

### Start the Application

```bash
npm start
```

Open:

```text
http://localhost:3000
```

For development:

```bash
npm run dev
```

## Demo Account

The project includes a seeded demo account for local testing:

```text
Email: test@example.com
Password: Password123!
```

These credentials are intended only for local/demo testing and should not be used in a real production deployment.

## Screenshots

Screenshots can be added to this section to showcase the project:

* Home / Product Catalog
* Product Details
* Login / Register
* Shopping Cart
* Checkout
* Order Confirmation
* Order History

Example:

```md
![NovaCart Home](screenshots/home.png)
```

## Portfolio Notes

This project was developed as a student/internship project to demonstrate practical understanding of:

* REST APIs
* Express.js routing
* Authentication
* Password hashing
* SQL/database design
* CRUD operations
* Session handling
* Server-side validation
* Transactional order processing
* Frontend-backend communication
* Responsive UI development

## Future Improvements

* Stripe or another real payment gateway
* Admin dashboard
* Product CRUD from admin panel
* Inventory management
* Customer reviews
* Email order confirmations
* Automated tests
* Production deployment
* HTTPS-only secure cookies
* Stronger request validation and rate limiting

## License

This project is intended as a portfolio and internship project.
