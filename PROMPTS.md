# Aura Engine — Development Prompts & Engineering Notes

## Project Overview

Aura Engine is a full-stack inventory management and business analytics application built to make a large product dataset easier to search, filter, analyse, and export.

**Tech Stack**
- Frontend: React.js and Vite
- Backend: Node.js and Express.js
- Database: MongoDB with Mongoose
- Validation: Zod middleware
- Deployment: Vercel and Render

**Live Demo:** https://aura-engine-red.vercel.app/inventory

**GitHub Repository:** https://github.com/btwitsnaushad/aura-engine

The main challenge was not just building the interface. It was making the application work with 50,001 inventory records while keeping search, filtering, analytics, CSV export, and deployment behaviour consistent.

This document explains the important development challenges, the prompts I used to get help when I was stuck, the approaches I followed, and what I learned while working through the problems.

---

## 1. Understanding the Existing Codebase

### The challenge

Before making changes, I needed to understand how the frontend, backend, API routes, controllers, and database were connected. Changing one file without understanding its dependencies could affect features that were already working.

### Development prompt

> Review the existing Aura Engine project structure before making changes. Trace how the React frontend requests inventory data from the Express API and how the backend queries MongoDB. Identify the relevant routes, controllers, product model, validation middleware, and environment configuration. Explain how these parts connect, then suggest the smallest changes needed for the requested feature. Preserve existing functionality and avoid modifying unrelated files.

### Engineering approach

- Followed the existing frontend-to-backend request flow.
- Checked how API parameters were passed and processed.
- Kept changes focused on the files responsible for each feature.
- Preferred improving the existing implementation over rewriting working components.

**What I learned:** Understanding the existing code before editing it makes debugging easier and reduces the risk of breaking unrelated functionality.

---

## 2. Handling 50,001 Inventory Records

### The challenge

The inventory contained more than 50,000 products. Loading the entire dataset into the browser for every request would create unnecessary network traffic and make the frontend handle more data than it needed.

### Development prompt

> Review the inventory API and implement server-side pagination for approximately 50,000 products. Keep search, category filtering, stock and price filters, and sorting on the backend. Return the matching records along with the total count and pagination details. Avoid fetching the entire collection for each page, validate query parameters, and preserve the existing API response structure wherever possible.

### Engineering approach

- Used server-side pagination with 50 records per page.
- Applied filtering and sorting through backend queries.
- Connected pagination to the total number of matching records.
- Checked the results against the larger dataset instead of relying only on a small sample.

### Verification

The live inventory displayed 50,001 total records across 1,001 pages.

**What I learned:** For a large dataset, the database should handle filtering and sorting before returning the limited set of records required by the frontend.

---

## 3. Making Search, Filters, and Sorting Work Together

### The challenge

Search, category selection, stock thresholds, price ranges, and sorting needed to work together. A filter could work individually but return incorrect results when combined with other conditions or used during export.

### Development prompt

> Review the inventory query logic and make sure search, category, stock, price, and sorting parameters work together. Validate numeric inputs, handle missing parameters safely, and apply filtering before pagination. Make sure the total count represents the filtered dataset. Test the API results against the selected conditions and avoid changing unrelated UI components.

### Engineering approach

- Used consistent query parameters between the frontend and backend.
- Applied filters before pagination.
- Checked that returned prices and stock quantities respected the selected limits.
- Tested search and sorting against API responses.
- Added a 500 ms delay to the search behaviour so that results update after the user pauses typing.

### Verification examples

| Test | Expected result |
|---|---|
| Search for `shirt` | Return matching products |
| Select a category | Return products in that category |
| Set a maximum stock value | Exclude products above the limit |
| Set minimum and maximum prices | Return products within the selected range |
| Change sort order | Return products in the requested order |

**What I learned:** Filters should be treated as one combined database query. Correct-looking inputs are not enough; the returned records must also be correct.

---

## 4. The Most Difficult Task: Improving CSV Export

### The challenge

Exporting a large inventory was more complicated than simply creating a CSV file. The original page-by-page approach required approximately 1,001 page requests to retrieve all 50,001 records.

I needed to consider how to export the complete matching dataset without losing active filters or making the browser handle unnecessary work.

### Development prompt

> Review the existing CSV export flow and identify why exporting the full inventory requires so many requests. Design a dedicated backend export endpoint that supports the current search, category, stock, price, and sorting options. Use a MongoDB cursor to process records in batches and stream the CSV response where appropriate. Handle CSV escaping, response headers, and errors correctly. Avoid loading the entire dataset into memory unnecessarily, and preserve the existing inventory UI.

### Engineering approach

The export flow uses a dedicated frontend API function to request a CSV file with the active search, filter, and sorting parameters.

The intended backend design uses:

- `GET /api/inventory/export`
- The same relevant search and filter conditions as the inventory listing.
- MongoDB cursor-based processing to handle records in batches.
- CSV formatting and suitable response headers.
- A blob response on the frontend to create the downloadable file.
- An exporting state to help prevent repeated clicks.

### Why this mattered

A dedicated backend export endpoint avoids requiring the browser to request every inventory page separately. It also separates displaying a page of products from exporting the complete matching dataset.

### Verification

The project testing notes recorded these results:

- Filtered search for `shirt` returned 2,055 matching records.
- Full export contained 50,001 product records.
- The CSV contained eight columns: SKU, Product Name, Category, Price, Cost, Stock Quantity, Reorder Level, and Last Updated.
- The frontend production build succeeded after the export changes.

**What I learned:** An implementation that works for a small dataset may become inefficient as the dataset grows. Correct output and efficient data retrieval both matter.

---

## 5. Product Validation and Data Integrity

### The challenge

Inventory data needs to follow business rules. Frontend validation alone is not sufficient because requests can also be sent directly to the API.

I worked with backend validation middleware using Zod to validate incoming product data.

### Development prompt

> Review the Zod validation schema and the product creation and update routes. Validate incoming product fields on the backend before database writes. Check required fields and numeric values, and enforce the inventory business rules that stock quantity cannot be negative and selling price cannot be lower than product cost. Return an appropriate client error for invalid input and preserve valid existing records.

### Engineering approach

- Used backend validation middleware to validate incoming product data.
- Kept server-side validation separate from frontend input checks.
- Considered validation for both product creation and update operations.
- Focused on protecting the database from invalid product values.

The important business rules for this feature are:

- Stock quantity must be zero or greater.
- Selling price must be greater than or equal to product cost.
- Invalid requests should be rejected rather than saved.

**What I learned:** Validation is not just about checking whether a field is filled in. It also protects business rules and helps maintain consistent inventory data.

---

## 6. Building Analytics with MongoDB Aggregation

### The challenge

The analytics dashboard needed to show useful inventory summaries without requiring the frontend to calculate everything from individual product records.

### Development prompt

> Review the existing analytics controller. Use MongoDB aggregation to calculate inventory KPIs and category-level inventory value directly in the database. Keep low-stock product identification as a separate query where that makes the logic clearer. Run independent operations concurrently where appropriate, return a predictable JSON response, and handle database errors without changing unrelated dashboard components.

### Engineering approach

I implemented MongoDB aggregation pipelines using `Product.aggregate()`.

The first pipeline uses `$group`, `$sum`, `$multiply`, and conditional logic to calculate:

- Total number of SKUs.
- Total inventory value using price multiplied by stock quantity.
- Number of products with zero stock.

The second pipeline groups inventory by category and calculates the total inventory value for each category.

I also used `Promise.all()` to run three independent operations concurrently: the KPI aggregation, the low-stock product query, and the category aggregation.

For risk assessment, the controller retrieves the ten lowest-stock products that still have inventory, sorted by stock quantity and product name.

The controller returns a structured response containing `kpis`, `riskAssessment`, and `portfolioDistribution`, making the results easier for the frontend dashboard to use.

**What I learned:** MongoDB aggregation can calculate summary metrics close to the data, while separate queries can handle details that are easier to retrieve directly.

---

## 7. Understanding Debounced Search

### The challenge

Sending a new API request for every character typed into the search field can create unnecessary requests. This becomes more noticeable when the application works with a large dataset.

### Development prompt

> Review the inventory search implementation and explain how the existing 500 ms delay works with React state, `useEffect`, and the inventory API. Keep the search behaviour consistent with pagination and filters. Make sure the previous timer is cancelled when the user continues typing, and verify that the API uses the latest search value after typing pauses.

### Engineering approach

I implemented a 500 ms debounced search directly in the Inventory component using React's `useEffect`, `setTimeout`, and `clearTimeout`.

When the user types, the timer waits for 500 ms before updating the debounced search value. If the user types again before the timer finishes, the cleanup function cancels the previous timer and starts a new one.

The inventory-fetching effect depends on the debounced search value. Once that value changes, the component requests the matching inventory records and resets pagination to the first page.

**What I learned:** Debouncing helps reduce unnecessary search updates and makes the search experience more practical when working with a large inventory.

---

## 8. Connecting the Frontend to the Deployed API

### The challenge

The application needed to work both locally and after deployment. The frontend could not continue using the local backend address when running on Vercel.

### Development prompt

> Review the Axios configuration and deployment environment settings. Make sure the frontend uses the configured API base URL in production while retaining the localhost fallback for local development. Check the URL format, avoid duplicated API paths, and test inventory and analytics requests against the hosted backend. Do not expose database credentials or other secrets in frontend code.

### Engineering approach

- Used `VITE_API_URL` to configure the frontend API base URL.
- Kept a localhost fallback for development.
- Configured the production frontend to use the hosted backend.
- Checked the deployed inventory API response.

The frontend is deployed on Vercel, and the backend is hosted on Render.

**What I learned:** A successful local run does not guarantee a successful production deployment. Environment variables and deployed API URLs need to be checked independently.

---

## 9. Fixing Direct Navigation to the Inventory Page

### The challenge

During deployment, opening the `/inventory` route directly initially returned a Vercel 404, even though navigation to Inventory from within the application worked.

This suggested that the issue was related to how the hosting platform handled frontend routes.

### Development prompt

> Investigate why direct navigation to `/inventory` returns a 404 on Vercel while client-side navigation works. Check the frontend routing and deployment configuration. Configure an appropriate single-page application fallback without interfering with API requests or static assets. Test the root route and direct navigation to `/inventory` after deployment.

### Engineering approach

The project notes record the addition of a `frontend/vercel.json` rewrite to route frontend requests to `/index.html`, allowing the React application to handle client-side routes.

The deployed Inventory page was then tested through its direct URL.

**What I learned:** Client-side navigation and server-side route resolution are different concerns. A single-page application needs the hosting platform to serve its entry point for valid frontend routes.

---

## 10. Debugging and Verifying Results

### The challenge

A successful production build does not prove that every feature works correctly with production data. I needed to check API responses, exported files, and deployment behaviour separately.

### Development prompt

> Validate the latest changes without rewriting working code. Run the frontend production build, inspect errors and warnings, test the relevant API endpoints, and compare actual results with the expected behaviour. Check the Git working tree before committing. After pushing changes, verify the production deployment and test the live application.

### Engineering approach

- Ran `npm run build` in the frontend.
- Investigated an unused export-function warning before integrating the function into the UI.
- Tested inventory search, filters, sorting, and pagination against the live API.
- Compared filtered and full CSV record counts with the expected results.
- Committed and pushed completed changes to the `master` branch.
- Checked the Vercel deployment status.

The frontend build also reported a large JavaScript bundle warning. The build succeeded, while bundle-size optimisation remains an area for future improvement.

**What I learned:** Reliable verification involves more than compilation. API behaviour, data integrity, exported files, and production deployment all need attention.

---

## 11. Working with AI as a Development Assistant

### The challenge

AI can help explain unfamiliar concepts and suggest solutions, but large code replacements can also introduce unrelated changes or remove existing functionality. I needed to keep each change focused on the actual problem.

### Development prompt

> Act as a careful engineering partner on the existing Aura Engine codebase. First explain the likely root cause and identify the files that need to change. Prefer small, reviewable edits over replacing entire files. Preserve existing UI, API contracts, and working features unless a change is necessary. Explain the proposed solution and how to test it.

### How I used this approach

- Broke larger problems into smaller tasks.
- Asked for explanations when I did not understand the existing code.
- Focused changes on the files responsible for each feature.
- Built and tested after meaningful changes.
- Used Git commits to preserve completed milestones.
- Checked the deployed application instead of relying only on local results.

**What I learned:** AI is most useful when it helps me understand a problem and evaluate possible solutions. Reviewing and testing the resulting code remain important parts of development.

---

## 12. Project Verification Summary

| Area | Recorded result |
|---|---|
| Inventory dataset | 50,001 records |
| Pagination | 50 records per page; 1,001 pages |
| Search | `shirt` returned 2,055 matching records |
| CSV export | Filtered and full exports checked |
| CSV structure | Eight expected columns |
| Analytics | KPI and category aggregation implemented |
| Backend deployment | Hosted API returned inventory data |
| Frontend build | Production build succeeded |
| Git workflow | Changes committed and pushed to `master` |
| Vercel deployment | Deployment reported Ready |
| Direct navigation | `/inventory` route tested |

---

## 13. What I Learned

Aura Engine helped me understand how different parts of a full-stack application work together.

The most valuable lessons were:

- Use server-side pagination for large datasets.
- Keep search, filtering, sorting, and export logic consistent.
- Use MongoDB aggregation for database-side summary calculations.
- Validate incoming data at the backend boundary.
- Understand how React state and API requests interact.
- Separate frontend routing problems from API problems.
- Test exported data instead of checking only whether a download starts.
- Verify environment settings and production behaviour.
- Use AI assistance to understand problems while reviewing and testing the resulting changes.

The most challenging part was learning how to investigate issues that did not have an obvious solution. I had to trace the code, understand unfamiliar concepts, try focused changes, and check whether the result matched what the application was supposed to do.

## Conclusion

Aura Engine gave me practical experience with the complete development cycle: understanding an existing codebase, improving frontend and backend features, querying a large dataset, debugging production issues, and verifying results.

The main lesson I took from this project is simple: **good engineering is not only about making a feature work; it is about making it work correctly, efficiently, and consistently in the environment where people will actually use it.**