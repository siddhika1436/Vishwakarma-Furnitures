# 🪑 Vishwakarma Furnitures — Full-Stack Web App v3

A production-ready furniture e-commerce application built with **React + Vite + Tailwind CSS** (frontend), **Express.js** (backend), and **MySQL** (database).

---

## ✨ Features

| Feature | Status |
|---|---|
| JWT Authentication (signup, login, logout) | ✅ |
| Email Verification via OTP | ✅ |
| **Password Reset via OTP** | ✅ NEW |
| Product Management (admin CRUD) | ✅ |
| Shopping Cart | ✅ |
| **Pincode-based Delivery Charges** | ✅ NEW |
| **Online Advance Payment (Razorpay)** | ✅ NEW |
| **PDF Invoice Generation** | ✅ NEW |
| **Admin Order Records + Filters** | ✅ NEW |
| **Admin Pincode Management** | ✅ NEW |
| **Shop Policies Page** | ✅ NEW |
| Order Status Management (admin) | ✅ |
| Email Notifications (OTP + Order) | ✅ |

---

## 🗂 Project Structure

```
vishwakarma-furnitures/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CheckoutPage.jsx      # Pincode delivery + advance payment
│   │   │   ├── OrdersPage.jsx        # Order history + invoice download
│   │   │   ├── ForgotPasswordPage.jsx # 3-step OTP password reset
│   │   │   ├── ShopPoliciesPage.jsx  # Return/Cancel/Delivery policies
│   │   │   └── admin/
│   │   │       ├── AdminOrders.jsx   # Full order management + filters
│   │   │       └── AdminPincodes.jsx # Pincode delivery charge manager
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # + Policies link
│   │   │   └── Footer.jsx            # + Policies link
│   │   └── utils/api.js              # All API helpers
│   └── .env.example
│
├── backend/                     # Express.js + MySQL
│   ├── routes/
│   │   ├── auth.js               # Signup, login, OTP verify, forgot password
│   │   ├── orders.js             # Orders + pincode delivery + invoice PDF
│   │   └── payment.js            # Razorpay integration
│   ├── services/
│   │   ├── delivery.js           # Pincode-based delivery charge lookup
│   │   ├── email.js              # Nodemailer: OTP + order emails
│   │   ├── invoice.js            # PDFKit invoice generator
│   │   └── payment.js            # Razorpay service
│   ├── middleware/auth.js
│   ├── config/db.js
│   ├── server.js
│   └── .env.example
│
└── database/schema.sql           # Complete MySQL schema v3
```

---

## 🚀 Setup Instructions

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

This creates the database, all tables, and seeds sample pincodes.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your API URL and Razorpay key
npm install
npm run dev
```

---

## 📧 Email Setup (Gmail SMTP)

1. Go to your Google Account → **Security** → **2-Step Verification** (enable it)
2. Search for **"App Passwords"** in Google Account
3. Generate an App Password for **Mail**
4. Copy the 16-character password into your `.env`:

```env
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

> ✅ Works with any SMTP provider — just change `SMTP_HOST` and `SMTP_PORT`.

---

## 💳 Razorpay Setup

### Get API Keys
1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys → Generate Key**
3. Copy **Key ID** and **Key Secret**
4. Add to backend `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Add **Key ID** to frontend `.env`:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
   ```

### Webhook Setup (optional but recommended)
1. In Razorpay Dashboard → **Webhooks → Add New Webhook**
2. URL: `https://your-backend.com/api/payment/razorpay/webhook`
3. Secret: any random string → add to backend `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_secret
   ```
4. Select events: `payment.captured` and `payment.failed`

### Test Card Numbers (Test Mode)
| Card Number | CVV | Expiry |
|---|---|---|
| 4111 1111 1111 1111 | Any 3 digits | Any future date |
| 5267 3181 8797 5449 | Any 3 digits | Any future date |

**Test UPI:** `success@razorpay`

---

## 📦 Delivery Charge System

Charges are stored in the `pincode_delivery_charges` table and managed from **Admin → Delivery Pincodes**.

### How it works:
1. Customer enters pincode at checkout
2. Frontend calls `GET /api/orders/delivery-charge?pincode=425503`
3. Backend looks up the pincode in the DB table
4. If found → returns the configured charge
5. If not found → returns default charge (₹500)
6. Delivery charge is stored in the order record

### Default pincodes (pre-seeded):
| Pincode | Area | Charge |
|---|---|---|
| 425503 | Faizpur | FREE |
| 425001 | Jalgaon | ₹80 |
| 424001 | Dhule | ₹250 |
| 422001 | Nashik | ₹450 |
| 400001 | Mumbai | ₹800 |

Admin can add/edit/delete pincodes from **Admin Panel → Delivery Pincodes**.

---

## 🧾 Invoice PDF

Invoices are generated server-side using **PDFKit** and include:
- Company header with branding
- Customer billing details
- Itemised product list with quantities and prices
- Subtotal, delivery charge, grand total
- Advance paid + remaining balance (for Razorpay orders)
- Payment status badge
- Order reference and date

**Download:** Users and admins can download invoices from:
- **My Orders page** → expand an order → "Download Invoice PDF"
- **Admin → Orders** → expand an order → "Invoice PDF"

API endpoint: `GET /api/orders/:id/invoice` (JWT authenticated)

---

## 💰 Advance Payment Flow

When a customer selects **"Pay Online (Advance)"** at checkout:

1. Customer uses a slider to choose advance % (20%–100% of total)
2. Order is created with `advance_paid` and `remaining_balance` fields
3. Razorpay checkout opens for the **advance amount only**
4. After payment, order status → `confirmed`, payment_status → `paid`
5. Customer pays remaining balance on delivery
6. Invoice clearly shows: Grand Total | Advance Paid | Remaining Balance

---

## 🔐 Password Reset Flow

1. Customer clicks "Forgot Password" on login page
2. Enters email → OTP sent to email (valid 10 min)
3. Enters OTP → verified → short-lived reset token issued
4. Sets new password using reset token

---

## 🛡 Admin Panel

Access: Login with `ADMIN_EMAIL` from `.env`

| Page | URL |
|---|---|
| Dashboard | `/admin` |
| Products | `/admin/products` |
| Orders | `/admin/orders` |
| Delivery Pincodes | `/admin/pincodes` |

### Order Filters (Admin):
- Filter by status (pending, confirmed, processing, shipped, delivered, cancelled)
- Filter by payment status (pending, paid, failed)
- Filter by date range
- Search by customer name or email

---

## 🌐 Deployment

### Backend (Railway / Render)
- Set all `.env` variables in hosting platform
- Entry point: `server.js`
- Build command: `npm install`

### Frontend (Vercel)
- Set `VITE_API_URL` to your backend URL
- Set `VITE_RAZORPAY_KEY_ID` to your Razorpay Key ID
- Build command: `npm run build`
- Output directory: `dist`

---

## 📞 Support

**Vishwakarma Furnitures**  
Faizpur, Jalgaon District, Maharashtra - 425503  
📞 +91 84215 12605
