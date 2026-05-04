-- ============================================================
-- VISHWAKARMA FURNITURES — MYSQL SCHEMA v3
-- Run this ENTIRE script in your MySQL database
-- MySQL 8.0+ recommended
-- ============================================================

CREATE DATABASE IF NOT EXISTS vishwakarma_furnitures
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vishwakarma_furnitures;

-- ─── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255),
  is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
  otp_code      VARCHAR(6)   DEFAULT NULL,
  otp_expires   DATETIME     DEFAULT NULL,
  otp_purpose   ENUM('verify','reset') DEFAULT 'verify',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── PRODUCTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  name         VARCHAR(500)   NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2)  NOT NULL,
  category     VARCHAR(100),
  image_url    TEXT,
  image_data   LONGBLOB,
  image_mime   VARCHAR(50),
  image_base64 LONGTEXT,
  stock        INT            NOT NULL DEFAULT 0,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_created_at (created_at),
  INDEX idx_products_stock (stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── PINCODE DELIVERY CHARGES ────────────────────────────────
CREATE TABLE IF NOT EXISTS pincode_delivery_charges (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pincode         VARCHAR(10)  NOT NULL UNIQUE,
  area_city       VARCHAR(255) NOT NULL,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pincode (pincode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ORDERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 VARCHAR(36)    NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id            VARCHAR(36),
  subtotal_amount    DECIMAL(12,2)  NOT NULL DEFAULT 0,
  delivery_charge    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  total_amount       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  advance_paid       DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  remaining_balance  DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  status             ENUM('pending','confirmed','processing','shipped','delivered','cancelled')
                     NOT NULL DEFAULT 'pending',
  payment_method     ENUM('cod','razorpay') NOT NULL DEFAULT 'cod',
  payment_status     ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
  payment_id         VARCHAR(255)   DEFAULT NULL,
  razorpay_order_id  VARCHAR(255)   DEFAULT NULL,
  shipping_name      VARCHAR(255),
  shipping_phone     VARCHAR(50),
  shipping_address   TEXT,
  shipping_pincode   VARCHAR(10),
  notes              TEXT,
  invoice_number     VARCHAR(50)    DEFAULT NULL,
  created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_orders_user_id (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at),
  INDEX idx_orders_payment_status (payment_status),
  INDEX idx_orders_invoice (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ORDER ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           VARCHAR(36)   NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  order_id     VARCHAR(36)   NOT NULL,
  product_id   VARCHAR(36),
  product_name VARCHAR(500),
  quantity     INT           NOT NULL DEFAULT 1,
  price        DECIMAL(10,2) NOT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_order_items_order_id (order_id),
  INDEX idx_order_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── SAMPLE PINCODE DATA ─────────────────────────────────────
INSERT IGNORE INTO pincode_delivery_charges (pincode, area_city, delivery_charge) VALUES
('425503', 'Faizpur, Jalgaon',   0.00),
('425504', 'Faizpur Rural',     20.00),
('425505', 'Bhadgaon',          50.00),
('425401', 'Yawal',             60.00),
('425502', 'Yawal Rural',       70.00),
('425001', 'Jalgaon City',      80.00),
('425002', 'Jalgaon',           80.00),
('425405', 'Muktainagar',      100.00),
('425201', 'Amalner/Erandol',  120.00),
('425101', 'Chalisgaon',       150.00),
('425301', 'Chopda',           180.00),
('424001', 'Dhule',            250.00),
('424101', 'Dhule Rural',      230.00),
('431001', 'Aurangabad',       400.00),
('444001', 'Akola',            350.00),
('422001', 'Nashik',           450.00),
('422002', 'Nashik',           450.00),
('440001', 'Nagpur',           500.00),
('411001', 'Pune',             600.00),
('413001', 'Solapur',          550.00),
('415001', 'Satara',           650.00),
('416001', 'Kolhapur',         700.00),
('400001', 'Mumbai',           800.00),
('400051', 'Mumbai Suburbs',   800.00);

-- ─── MIGRATION: If upgrading from v2 schema ──────────────────
-- Run only if tables already exist with old structure:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_purpose ENUM('verify','reset') DEFAULT 'verify';
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER user_id;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER delivery_charge;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER advance_paid;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_pincode VARCHAR(10) DEFAULT NULL AFTER shipping_address;
-- ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50) DEFAULT NULL;
-- ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(500) AFTER product_id;
