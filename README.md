# Aura Engine

**Full-Stack Inventory Management & Business Analytics Dashboard**

Aura Engine is a web-based inventory management and analytics application designed to make large product datasets easier to search, manage, and analyse. It brings inventory tracking, advanced filtering, pagination, CSV export, and business analytics together in a single dashboard.

The application uses server-side data queries to handle large inventories efficiently and provides clear visibility into stock levels, inventory valuation, and products that may require replenishment.

**Live Application:** https://aura-engine-red.vercel.app/inventory

**Source Code:** https://github.com/btwitsnaushad/aura-engine

---

## Table of Contents

- Overview
- Key Features
- Technical Highlights
- Technology Stack
- Project Structure
- Application Workflow
- Getting Started
- Environment Configuration
- API Reference
- Testing and Verification
- Deployment
- Author

---

## Overview

Aura Engine provides a central interface for exploring inventory records and understanding inventory performance.

Users can browse products in manageable pages, search for relevant records, apply supported filters, sort results, and export inventory data. The analytics dashboard provides a summary of stock levels and inventory valuation through KPI cards and charts.

The application separates the frontend, backend, and database responsibilities to keep the interface, API logic, and data operations organised.

### Core Modules

- **Inventory Management:** Browse and manage product records.
- **Search and Filtering:** Find products using search terms and supported filter conditions.
- **Analytics Dashboard:** Review inventory KPIs, category valuation, and low-stock products.
- **CSV Export:** Download inventory data for offline use and reporting.

---

## Key Features

### 1. Inventory Management

- Display product information in a structured inventory interface.
- Work with fields such as SKU, product name, category, price, cost, and stock quantity.
- Navigate a large product dataset without rendering all records on a single page.

### 2. Search and Advanced Filtering

- Search for relevant inventory records.
- Filter products by category.
- Apply stock-level conditions.
- Filter using minimum and maximum price values.
- Combine supported search and filter parameters to narrow results.

### 3. Server-Side Pagination

The inventory interface retrieves a limited number of records from the backend for each page.

The current configuration uses **50 records per page**. Pagination metadata allows the frontend to display the number of matching records and navigate through the available pages.

### 4. Sorting

Organise inventory results using supported sort fields, such as price or stock quantity. Sorting is processed through the inventory query flow so that the returned records follow the requested order.

### 5. CSV Export

Export inventory records to a downloadable CSV file for offline access and further analysis.

The export flow is designed to support relevant search and filter parameters so that users can export the records they need.

### 6. Analytics Dashboard

The dashboard presents important inventory metrics and visual summaries.

- **Total SKUs:** Number of product records.
- **Total Inventory Value:** Inventory valuation calculated using product price and stock quantity.
- **Out of Stock:** Number of products with zero stock.
- **Inventory Value by Category:** Category-level inventory valuation.
- **Lowest Stock Products:** Products with low remaining stock that may require replenishment.

### 7. Dashboard Interface

The interface includes navigation, KPI cards, visual analytics, and dark/light theme support. The layout is designed to keep key inventory information accessible and easy to review.

---

## Technical Highlights

### Large Dataset Handling

Server-side pagination limits the number of records returned to the frontend. Search, filtering, and sorting are handled through backend queries rather than requiring the browser to process the entire inventory.

### Debounced Search

The inventory search uses a 500 ms delay implemented with React's `useEffect`, `setTimeout`, and `clearTimeout`.

The timer is cancelled and restarted when the search input changes. Once the user pauses typing, the debounced search value updates and the inventory request can run with the latest value.

### MongoDB Aggregation

The analytics controller uses MongoDB aggregation pipelines to calculate inventory summaries within the database.

The KPI aggregation calculates total SKUs, inventory valuation, and out-of-stock counts. A separate aggregation groups inventory value by category. The controller also runs independent analytics operations concurrently using `Promise.all()`.

### Backend Validation

The backend uses Zod middleware to validate product data before database operations. Validation rules should enforce the inventory business constraints, including non-negative stock quantities and a selling price that is not below cost.

### Environment-Based API Configuration

The frontend uses `VITE_API_URL` to configure the API base URL, with a local development fallback. This allows the application to use the appropriate backend address in development and production.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Validation | Zod |
| API Communication | Axios |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Version Control | Git, GitHub |

---

## Project Structure

The application separates frontend components, API communication, backend routes, database models, and business logic.

```text
aura-engine/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vercel.json
│
├── PROMPTS.md
├── README.md
└── .gitignore
```

*This tree shows the main project layout. The exact files may vary with the current repository version.*

### Frontend Responsibilities

- Render the dashboard and inventory interface.
- Manage search, filters, sorting, and pagination controls.
- Request inventory and analytics data from the API.
- Display KPI cards, charts, and export actions.

### Backend Responsibilities

- Expose API routes for inventory and analytics.
- Process supported query parameters.
- Retrieve and calculate data using MongoDB and Mongoose.
- Validate product data before write operations.

### Database Responsibilities

- Store product records.
- Support inventory queries and filtering.
- Calculate analytics using aggregation pipelines.

---

## Application Workflow

### Inventory Workflow

1. The user opens the inventory page.
2. The frontend requests the selected page and supported query parameters.
3. The backend processes the search, filters, sorting, and pagination.
4. MongoDB retrieves the matching records.
5. The API returns the records and pagination information.
6. The frontend displays the results.

### Analytics Workflow

1. The frontend requests analytics data.
2. The backend runs the KPI aggregation, category aggregation, and low-stock query.
3. The controller returns the results in a structured JSON response.
4. The frontend displays the summary cards and charts.

### Export Workflow

1. The user starts a CSV export.
2. The frontend sends the relevant search and filter parameters.
3. The backend export endpoint retrieves the matching data, where configured.
4. The response is processed as a downloadable CSV file.

---

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js
- npm
- MongoDB or a MongoDB Atlas connection
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/btwitsnaushad/aura-engine.git
cd aura-engine
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory and configure the variables required by the backend.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

Use the variable names expected by the actual server configuration. Do not commit real database credentials to GitHub.

Start the backend:

```bash
npm start
```

If the backend defines a development script, you can use:

```bash
npm run dev
```

### 3. Install Frontend Dependencies

Open a separate terminal from the project root:

```bash
cd frontend
npm install
```

For local development, configure the frontend API URL if required:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite in the terminal.

### 4. Build for Production

From the `frontend` directory, run:

```bash
npm run build
```

Vite generates the production build in the `dist` directory by default.

---

## Environment Configuration

The application uses environment variables to keep local and production configuration separate.

| Variable | Purpose |
|---|---|
| `PORT` | Backend server port, if used by the server |
| `MONGODB_URI` | MongoDB connection string |
| `VITE_API_URL` | Frontend API base URL |

Configure the appropriate variables in:

- `backend/.env` for local backend development.
- `frontend/.env` for local frontend development, when required.
- Vercel environment settings for the production frontend.
- Render environment settings for the production backend.

**Security:** Do not expose MongoDB credentials or private server secrets in frontend code. Variables prefixed with `VITE_` are available to the client-side application and should not contain secrets.

---

## API Reference

The backend provides endpoints for inventory operations and analytics.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/inventory` | Retrieve inventory records with supported query parameters |
| GET | `/api/analytics` | Retrieve KPI and analytics data |
| POST | `/api/inventory` | Create a product, if configured in the backend |
| PUT | `/api/inventory/:id` | Update a product, if configured in the backend |
| GET | `/api/inventory/export` | Export inventory data, if the dedicated export route is configured |

### Inventory Query Example

```text
GET /api/inventory?page=1&limit=50&search=audio&category=electronics&sort=-price
```

The available query parameters depend on the backend implementation. Supported parameters can include pagination, search, category, stock conditions, price limits, and sorting.

### Analytics Response

The analytics controller returns a structured JSON response containing:

- `kpis`
- `riskAssessment`
- `portfolioDistribution`

These properties supply the information required by the dashboard's summary cards and charts.

---

## Testing and Verification

The application should be checked at both the API and user-interface levels.

### Inventory

- Verify that each page returns the expected number of records.
- Test search, category filtering, stock conditions, and price ranges.
- Confirm that sorting follows the requested order.
- Check that pagination metadata reflects the matching dataset.

### Analytics

- Compare KPI values against the database results.
- Check category-level inventory valuation.
- Verify that the low-stock list contains the expected products.

### CSV Export

- Confirm that the file downloads successfully.
- Inspect the CSV columns and data.
- Check that supported filters are reflected in the exported records.

### Production

- Run the frontend production build.
- Verify the deployed API URL and environment configuration.
- Test the live application after deployment.
- Inspect request and response times using browser developer tools or an API client.

---

## Deployment

Aura Engine uses separate hosting environments for the frontend and backend.

- **Frontend:** [Vercel](https://aura-engine-red.vercel.app/inventory)
- **Backend:** [Render](https://aura-engine-backend-new.onrender.com)
- **Source Code:** [GitHub Repository](https://github.com/btwitsnaushad/aura-engine)

The frontend connects to the backend through the configured `VITE_API_URL` environment variable. Production environment variables and database credentials must be configured in their respective hosting platforms.

After deployment, verify the live inventory page, analytics requests, and other main user flows.

---

## Author

**Developed by:** Naushad Ahamad