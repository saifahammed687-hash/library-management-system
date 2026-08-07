-- Library Management System - MySQL Schema
-- Run this once to create the database and tables:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS library_system;
USE library_system;

-- Users sign up with NO permanent role. Role is chosen only at login time
-- (same behaviour as the original C console program).
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    gmail VARCHAR(60) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(15) PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    author VARCHAR(60) NOT NULL,
    category VARCHAR(40) NOT NULL,
    quantity INT NOT NULL,
    available INT NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    book_id VARCHAR(15) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    returned TINYINT(1) NOT NULL DEFAULT 0,
    renew_count INT NOT NULL DEFAULT 0,
    fine DECIMAL(10,2) NOT NULL DEFAULT 0,
    fine_paid TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    book_id VARCHAR(15) NOT NULL,
    reservation_date DATE NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS book_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    title VARCHAR(80) NOT NULL,
    author VARCHAR(60) NOT NULL,
    category VARCHAR(40) NOT NULL,
    request_date DATE NOT NULL,
    status TINYINT NOT NULL DEFAULT 0 -- 0 Pending, 1 Approved, 2 Rejected
);

CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    library_name VARCHAR(80) NOT NULL DEFAULT 'Library Management System',
    fine_per_day DECIMAL(10,2) NOT NULL DEFAULT 10.00
);

INSERT INTO settings (id, library_name, fine_per_day)
VALUES (1, 'Library Management System', 10.00)
ON DUPLICATE KEY UPDATE id = id;
