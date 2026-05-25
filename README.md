# 📦 Allo Reservation System

A full-stack inventory reservation system built with **Next.js (App Router)**, **Prisma**, **PostgreSQL (Neon)**, and **TypeScript**.  
It solves the overselling problem in e-commerce by implementing a **time-bound stock reservation system**.

---

## 🚀 Live Features

- 📦 Product listing with warehouse-level inventory  
- 🔒 Stock reservation system (prevents overselling)  
- ⏳ Time-based reservation expiry  
- ✅ Confirm reservation after payment success  
- ❌ Release reservation on cancellation/failure  
- ⚡ Concurrency-safe backend using database transactions  
- 🌐 REST APIs built with Next.js Route Handlers  

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS  
- **Backend:** Next.js API Routes  
- **Database:** PostgreSQL (Neon)  
- **ORM:** Prisma  
- **Deployment:** Vercel + Neon  

---

## 📁 Project Structure

```txt
app/
  api/
    products/
    warehouses/
    reservations/
lib/
  prisma.ts
prisma/
  schema.prisma
  migrations/
public/
---

---

## 🧠 Core Concept

This project solves a real-world e-commerce problem:

* If stock is deducted only after payment → overselling happens
* If stock is reserved too early → inventory looks unavailable

### ✅ Solution: Reservation System

```txt
Reserve → Hold stock (PENDING)
        ↓
Confirm → Deduct stock permanently (CONFIRMED)
        ↓
Release → Return stock back (RELEASED)
        ↓
Auto-expiry → Releases after timeout
```

---

## 🔌 API Endpoints

### 📦 Products

```
GET /api/products
```

Returns products with warehouse-wise stock.

---

### 🏬 Warehouses

```
GET /api/warehouses
```

Returns all warehouse locations.

---

### 📌 Create Reservation

```
POST /api/reservations
```

Request Body:

```json
{
  "productId": "string",
  "warehouseId": "string",
  "quantity": 1
}
```

---

### ✅ Confirm Reservation

```
POST /api/reservations/:id/confirm
```

Marks reservation as **CONFIRMED** and reduces stock permanently.

---

### ❌ Release Reservation

```
POST /api/reservations/:id/release
```

Releases reserved stock back to inventory.

---

### 🔍 Get Reservation

```
GET /api/reservations/:id
```

Fetch reservation details and status.

---

## ⚙️ Database Models

* Product
* Warehouse
* Inventory (product-stock per warehouse)
* Reservation (status + expiry tracking)

---

## 🔐 Key Engineering Feature

### ⚡ Concurrency-Safe Reservation

Implemented using:

* Prisma Transactions
* Row-level locking (`FOR UPDATE`)
* Atomic stock updates

This ensures:

> Even if 100 users click "Reserve" at the same time, only valid stock is allocated — no overselling.

---

## ⏳ Expiry Mechanism

Reservations expire after a fixed time (e.g. 10 minutes).

Handled via:

* `expiresAt` field in DB
* validation during confirm/release
* (can be extended with cron job or background worker)

---

## 🧪 How to Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

Create a `.env` file:

```env
DATABASE_URL=your_neon_postgres_url
```

### 3. Run migrations

```bash
npx prisma migrate dev
```

### 4. Seed database

```bash
npx prisma db seed
```

### 5. Start development server

```bash
npm run dev
```

App runs at:

```
http://localhost:3000
```

---

## 📌 Environment Variables

| Variable     | Description                       |
| ------------ | --------------------------------- |
| DATABASE_URL | Neon PostgreSQL connection string |

---

## 💡 Trade-offs / Notes

* Expiry cleanup is handled logically (not cron-based for simplicity)
* Redis locking not used; PostgreSQL transactions ensure consistency
* UI kept minimal to focus on backend correctness
* Designed for evaluation/demo clarity over production complexity

---

## 📈 What This Project Demonstrates

* Full-stack development (Frontend + Backend)
* Database design for real-world systems
* Concurrency handling in distributed scenarios
* API design & REST principles
* Production-ready thinking with trade-offs

---

## 👨‍💻 Author

**Sai Lakshmi R**
Computer Science (Business Analytics)

---

## 📌 Status

* ✅ Fully Functional
* ✅ Backend Complete
* ✅ Frontend Connected
* ✅ Ready for Deployment



