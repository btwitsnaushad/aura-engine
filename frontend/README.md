# Aura Engine

Aura Engine is a full-stack inventory management and analytics application designed to make product tracking and inventory monitoring easier. It provides a clean dashboard to view stock levels, search and filter products, manage inventory records, and understand inventory performance through visual analytics.

## Features

- **Inventory Management:** View and manage product records.
- **Search and Filters:** Find products by name or SKU and filter by category, stock level, and price range.
- **Pagination:** Browse inventory records in manageable pages.
- **Sorting:** Organize products by different fields.
- **CSV Export:** Export inventory records for further analysis.
- **Analytics Dashboard:** View inventory valuation by category and identify products with low stock.
- **KPI Cards:** See key inventory metrics at a glance.
- **Responsive Dashboard:** A clean interface with dark and light theme support.

## Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

## Project Structure

```text
aura-engine/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB connection

### 1. Clone the Repository

```bash
git clone https://github.com/btwitsnaushad/aura-engine.git
cd aura-engine
```

### 2. Start the Backend

```bash
cd backend
npm install
```

Configure your MongoDB connection and other required environment variables in the backend `.env` file, then run:

```bash
npm start
```

### 3. Start the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in your terminal to use the application.

## Purpose

Aura Engine demonstrates how a full-stack application can combine inventory management, data filtering, pagination, and analytics to support more informed business decisions.

## Author

**Aura Engine Project**

