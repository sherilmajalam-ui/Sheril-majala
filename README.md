# Fresh Farm Farmer Direct Selling System

Farmers list produce, customers order directly, and both track the order to delivery.

- **Frontend:** React, Vite, React Router (`frontend/`)
- **Backend:** Node.js, Express, MySQL, JWT login (`backend/`)

## Setup

You need **Node.js** and **MySQL** installed.

```bash
npm install
```

Run this in the project folder. It installs both the `backend` and `frontend` packages.

Copy `.env.example` to `.env` and fill in your MySQL password and a JWT secret:

```
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fresh_farm
JWT_SECRET=any_long_random_text
```

Create the tables and demo data:

```bash
mysql -u root -p < database/schema.sql
npm run seed
```

Start the app (builds the React site, then starts the backend):

```bash
npm start
```

Open **http://localhost:5001**. The backend serves the built React site too.

While editing the React code, run `npm run server` in one terminal and `npm run dev` in another,
then open **http://localhost:5173**. It reloads on save and forwards `/api` calls to the backend.

## Demo accounts

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Farmer   | farmer@freshfarm.com   | farmer123   |
| Farmer   | green@freshfarm.com    | farmer123   |
| Customer | customer@freshfarm.com | customer123 |

## Troubleshooting

**"Access to localhost was denied – HTTP ERROR 403" on a Mac.**
macOS AirPlay Receiver uses port 5000. That's why this project uses port 5001.
If you change `PORT` in `.env`, also change `BACKEND_PORT` in `frontend/vite.config.js`.

**"Can't reach the server"** – the backend isn't running. Run `npm start` in the project folder.

**"Website not built yet"** – run `npm run build` in the project folder.

**`ER_ACCESS_DENIED_ERROR`** – the MySQL user or password in `.env` is wrong.

**`ER_BAD_DB_ERROR`** – run `database/schema.sql` first.

**To reset all data** – run `schema.sql` again, then `npm run seed`.

## Pages

Each route is a React component in `frontend/src/pages/`.

| Route | Who | What it does |
|-------|-----|--------------|
| `/` | Everyone | Home page |
| `/farmer` | Farmers | Login and registration |
| `/customer` | Customers | Login and registration |
| `/products` | Everyone | Browse, search, filter, add to cart |
| `/cart` | Customers | Change quantities, remove items |
| `/checkout` | Customers | Address, payment method, place order |
| `/orders` | Customers | Order history, cancel, track |
| `/order-tracking?id=` | Customer / farmer | Status timeline and delivery details |
| `/farmer-dashboard` | Farmers | Stats, products, order status, assign delivery |
| `/add-product` | Farmers | Add or edit a product (`?id=` to edit) |

## API

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/farmers/register`, `/api/farmers/login` | Public |
| GET | `/api/farmers/me` | Farmer |
| POST | `/api/customers/register`, `/api/customers/login` | Public |
| GET | `/api/customers/me` | Customer |
| GET | `/api/products?search=&category=` | Public |
| GET | `/api/products/:id` | Public |
| GET | `/api/products/my-products` | Farmer |
| POST / PUT / DELETE | `/api/products`, `/api/products/:id` | Farmer (own products only) |
| POST | `/api/orders` | Customer |
| GET | `/api/orders/my-orders` | Customer |
| GET | `/api/orders/farmer-orders` | Farmer |
| GET | `/api/orders/:id` | Order's customer or farmer |
| PUT | `/api/orders/:id/status` | Farmer |
| PUT | `/api/orders/:id/cancel` | Customer (only while "Placed") |
| GET | `/api/payments/my-payments` | Customer |
| GET | `/api/payments/order/:orderId` | Order's customer or farmer |
| POST | `/api/deliveries` | Farmer |
| GET | `/api/deliveries/order/:orderId` | Order's customer or farmer |

## How it works

- Prices are always taken from the database. The browser can't change what an order costs.
- Stock is checked and reduced when an order is placed, and returned if it's cancelled.
- Payment is collected on delivery. It's "Pending" until the order is marked Delivered, then "Paid".
- Deleting a product hides it from the shop but keeps it in past orders.
- If an order has items from two farmers, either farmer's status update applies to the whole order.
