# 🧋 Lucky Boba POS System

A professional, full-stack Point of Sale (POS) solution designed for retail efficiency. This system leverages a modern decoupled architecture to provide a fast, secure, and scalable experience for both staff and management.

---

## 🚀 Tech Stack

### **Frontend**
* **Core:** React 18 (Vite) & TypeScript
* **Styling:** Tailwind CSS v4
* **Routing:** React Router Dom v6 (with Protected Routes)
* **Icons:** Lucide React

### **Backend**
* **Core:** Laravel 11 (PHP 8.3)
* **Authentication:** Laravel Breeze
* **Caching/Session:** Redis
* **Database:** MariaDB (Production) & SQLite (Testing)

### **DevOps & Workflow**
* **CI/CD:** GitHub Actions (Automated Testing & Build Checks)
* **Workflow:** Git Flow (Feature -> Development -> Staging -> Main)
* **Security:** Branch Protection Rules & Admin Overrides

---

## 🏗️ Architecture & Workflow

We utilize a strict **Git Flow** to ensure code quality and system stability. No code reaches the `main` branch without passing through our automated CI/CD pipeline.



1.  **Feature Branches:** Developers work on isolated tasks.
2.  **Development:** Integration branch for active features.
3.  **Staging:** Final testing environment mirroring production.
4.  **Main:** Production-ready code.

---

## 🛠️ Installation & Setup

### **Prerequisites**
* PHP 8.3 & Composer
* Node.js (v20+) & npm
* MariaDB / MySQL
* Redis Server

### **Backend Setup**
1.  Navigate to the backend folder: `cd backend`
2.  Install dependencies: `composer install`
3.  Configure environment: `cp .env.example .env`
4.  Generate app key: `php artisan key:generate`
5.  Run migrations: `php artisan migrate`
6.  Start server: `php artisan serve`

### **Frontend Setup**
1.  Navigate to the frontend folder: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start development server: `npm run dev`

---

## 🔒 Security & Data Integrity

* **Protected Routes:** React Router guards ensure that only authenticated users can access the POS Dashboard.
* **CI/CD Safety:** GitHub Actions automatically run PHPUnit tests and Vite build checks on every Pull Request.
* **Data Recovery:** Dual-layer database strategy utilizing Cloud MariaDB for operations and Local MariaDB for off-site disaster recovery.



---


© 2026 Lucky Boba POS Project. Built for OJT Implementation.
