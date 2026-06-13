# AnandBazaar - Jagannath Prasadam Catering Platform

A full-stack MERN application for managing a Krishna conscious catering service — from customer ordering to stock management, procurement, invoicing, and admin operations.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend                      │
│  Landing Page │ Ordering │ Dashboards │ Admin Panel  │
└────────────────────┬────────────────────────────────┘
                     │ REST API (JWT Auth)
┌────────────────────┴────────────────────────────────┐
│              Express.js Backend                       │
│  Auth │ Orders │ Stock │ Procurement │ Invoices      │
│  Notifications │ Excel Import │ Admin                │
└────────────────────┬────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────┴────────────────────────────────┐
│                   MongoDB                            │
│  Users │ Items │ Orders │ Stock │ Invoices │ Logs    │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer       | Technology                         |
|-------------|-----------------------------------|
| Frontend    | React 18, React Router, Axios     |
| UI          | CSS Modules, Custom Design System |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB, Mongoose                 |
| Auth        | JWT, bcrypt, Passport.js          |
| Notifications | Nodemailer, Twilio (pluggable) |
| Deployment  | Docker, Docker Compose            |

## Project Structure

```
AnandBazaar_Workflow/
├── backend/
│   ├── config/           # DB, auth, app config
│   ├── controllers/      # Route handlers
│   ├── middleware/        # Auth, RBAC, validation, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── services/         # Business logic
│   ├── utils/            # Helpers, Excel parser, logger
│   ├── seeds/            # Seed data scripts
│   ├── server.js         # Entry point
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── item_images/  # Food item images
│   │   └── lord_image/   # Devotional background images
│   ├── src/
│   │   ├── api/          # Axios API client
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Page components
│   │   ├── styles/       # Theme, design tokens, global CSS
│   │   ├── utils/        # Frontend utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (or use Docker)
- npm or yarn

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment

Edit `backend/.env` with your MongoDB URI and secrets.

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Docker (Alternative)

```bash
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## Default Admin Credentials

```
Email: admin@anandbazaar.com
Password: Admin@123
```

## User Roles

| Role        | Capabilities                                      |
|-------------|--------------------------------------------------|
| customer    | Browse items, place orders, view order status     |
| stock_team  | Daily stock-taking, update raw material quantities|
| procurement | View requirements, manage procurement status      |
| admin       | Full control: orders, pricing, invoices, users    |

A single user can hold multiple roles.

## API Endpoints Summary

### Auth
- `POST /api/auth/register` - Customer signup
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/otp/request` - Request OTP
- `POST /api/auth/otp/verify` - Verify OTP
- `POST /api/auth/google` - Google login
- `GET /api/auth/me` - Current user profile

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders` - List orders (filtered by role)
- `GET /api/orders/:id` - Order detail
- `PUT /api/orders/:id` - Update order
- `PATCH /api/orders/:id/status` - Change order status
- `PATCH /api/orders/:id/approve` - Admin approve

### Food Items
- `GET /api/items` - List food items (public)
- `POST /api/items` - Create item (admin)
- `PUT /api/items/:id` - Update item (admin)
- `DELETE /api/items/:id` - Delete item (admin)

### Raw Materials
- `GET /api/raw-materials` - List raw materials
- `PUT /api/raw-materials/:id` - Update (admin)

### Stock
- `GET /api/stock` - Current stock
- `POST /api/stock/daily` - Submit daily stock
- `GET /api/stock/history` - Stock history
- `PUT /api/stock/:id` - Update stock entry

### Procurement
- `GET /api/procurement` - List procurement needs
- `POST /api/procurement` - Create procurement entry
- `PATCH /api/procurement/:id/status` - Update status

### Invoices
- `POST /api/invoices` - Generate invoice
- `GET /api/invoices/:id` - View invoice
- `GET /api/invoices` - List invoices

### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments/order/:orderId` - Payments for order

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/dashboard` - Dashboard stats
- `POST /api/admin/import-excel` - Import Excel data

### Notifications
- `GET /api/notifications` - User notifications
- `PATCH /api/notifications/:id/read` - Mark read
- `PATCH /api/notifications/read-all` - Mark all read

## License

Private - AnandBazaar Prasadam Service
