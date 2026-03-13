# Logistics Project Updates – Implementation Plan

This document outlines the step-by-step implementation for the requested updates to the Guangzhou Swift Logistics project.

---

## 1. Create Shipment Modal (`CreateShipmentModal.tsx`)

### 1.1 Remove Declared Value Field
- **File:** `src/components/modals/CreateShipmentModal.tsx`
- Remove `declaredValue` from `formData` state.
- Remove the "Declared Value ($)" input section from the form.
- In `handleSubmit`, do not include `declaredValue` in the payload (or send `undefined`).
- **API/Model:** The Shipment model may still have `declaredValue`; the API can accept missing/undefined and default to `0` if required by the schema.

### 1.2 Service Type: Only "Air" and "Shipping" (No Days)
- **File:** `src/components/modals/CreateShipmentModal.tsx`
- Change the Service Type dropdown to exactly two options:
  - **Air** → map to `serviceType: "standard"` (or keep existing air mapping).
  - **Shipping** → map to `serviceType: "overnight"` (sea shipping).
- Remove any text that shows "X–Y days" (e.g. "10–14 days", "35–45 days") from the option labels so only "Air" and "Shipping" are shown.

### 1.3 Purchase Information: Only Purchase Shop Tracking Number
- **File:** `src/components/modals/CreateShipmentModal.tsx`
- Keep the "Purchase Shop Tracking Number" field.
- **Comment out** the "Name Used for Purchase" field (label + input). Do not remove the data structure: keep `wholesalePurchases` as `{ name: string; trackingNumber: string }[]` but only collect `trackingNumber` in the UI (name can be empty or a placeholder).
- Ensure the payload still sends `wholesalePurchases` with at least `trackingNumber`; `name` can be empty string if needed for backend compatibility.

### 1.4 Store Documents in Vercel Blob (Instead of MongoDB)
- **Current behavior:** In `src/app/api/admin/shipments/route.ts`, documents are converted to base64 and stored in MongoDB via `fileToShipmentDocument`.
- **Target behavior:** Match the pattern used in Edit Shipment (PATCH): upload each file to Vercel Blob and store only the URL (and optionally filename) in the shipment.
- **Steps:**
  1. In `src/app/api/admin/shipments/route.ts` (POST):
     - Import `put` from `@vercel/blob`.
     - For each file in `formData.getAll("documents")`, upload with `put()` to a path like `shipment-documents/{trackingId}/{timestamp}-{filename}` (use a temporary trackingId or placeholder before insert if needed – or generate trackingId first, then upload, then insert).
     - Build an array of document objects: `{ name, type, size, url: blob.url, uploadedAt }` (or similar). If the existing schema expects `data`, add a `url` field and keep storing minimal metadata; update the model if necessary to support `url` instead of `data` for new uploads.
  2. Update the Shipment model/types if documents are to store `url` (Vercel Blob URL) instead of base64 `data`. For backward compatibility, you can support both: new documents have `url`, old ones have `data`.
  3. Ensure Create Shipment modal still sends `documents` as `FormData` files; the API will upload them to Blob and save URLs in the new shipment.

**Reference:** See how `EditShipmentModal` sends the image and how `PATCH /api/admin/shipments/[id]` uses `put()` from `@vercel/blob` to store the image and save `imageUrl` in the timeline.

---

## 2. Bulk Update: Set One DELTA Number for Multiple Shipments

### 2.1 Backend: Bulk Update API
- **File:** `src/app/api/admin/shipments/bulk-update/route.ts`
- Current body: `{ shipmentIds, status, estimatedDelivery }`.
- Add optional `deltaNumber` (string). When provided, set `deltaNumber` on all selected shipments (in addition to or instead of status – confirm product intent: e.g. allow bulk update to only set DELTA, or set status + DELTA).
- In the update object, set `updateData.deltaNumber = deltaNumber?.trim() || undefined` when `deltaNumber` is present. If the requirement is "only set DELTA", you can make `status` optional and only require either `status` or `deltaNumber`.

### 2.2 Frontend: Bulk Update Modal
- **File:** `src/components/modals/BulkUpdateShipmentModal.tsx`
- Add a field: "DELTA Number" (optional text input).
- On submit, send `deltaNumber` in the request body along with existing fields.
- Validation: require either status or deltaNumber (or both) so the bulk action is meaningful.

---

## 3. User Dashboard: Table of Tracking Numbers Arrived at US Warehouse

### 3.1 Data Shape
- For the **current user**, show:
  - All **tracking numbers** that have **arrived at the US warehouse** (i.e. shipment status = `arrived-at-warehouse`).
  - Tracking numbers = main shipment `trackingId` + any `wholesalePurchases[].trackingNumber` for that shipment.
  - For each row: **Tracking Number** | **Shipment** (the shipment tracking ID or shipment reference) | **Date Added** (e.g. `createdAt` of the shipment, or when the item was added to the system).

### 3.2 API
- **Option A:** Extend `GET /api/user/stats` to include a new key, e.g. `arrivedAtWarehouseTrackingNumbers: { trackingNumber, shipmentTrackingId, dateAdded }[]`.
- **Option B:** New endpoint `GET /api/user/warehouse-tracking` returning the same structure.
- Implementation: query shipments where `userId = session.user.id` and `status === 'arrived-at-warehouse'`. For each shipment, emit one row for `trackingId` (main) and one row for each `wholesalePurchases[].trackingNumber`, with shipment reference and `createdAt` as date added.

### 3.3 Frontend: Dashboard Overview
- **File:** `src/components/dashboard/DashboardOverview.tsx`
- Add a new section: **"Tracking Numbers at US Warehouse"** (or similar).
- Render a **professional table** with columns: **Tracking Number**, **Shipment**, **Date Added**.
- Use the same design system as the rest of the dashboard (e.g. white card, bordered table, header row).
- Load data from the new or extended API and handle empty state.

---

## 4. Staff Access to Analytics & Reports Page

### 4.1 Allow Staff to Access Analytics API
- **File:** `src/app/api/admin/analytics/route.ts`
- Change the auth check from `session.user.role !== "admin"` to allow **staff** as well, e.g. `(session.user.role !== "admin" && session.user.role !== "staff")` so both admin and staff can access.

### 4.2 Allow Staff to See Analytics in Sidebar
- **File:** `src/components/dashboard/AdminDashboardLayout.tsx`
- In the `navigationItems` filter for staff, add `"analytics"` to the allowed list so staff see "Analytics & Reports" and can open `/admin-dashboard/analytics`.

### 4.3 Analytics Page Protection
- Ensure the analytics page (e.g. middleware or layout) allows both `admin` and `staff` roles for `/admin-dashboard/analytics`. If there is a role check at page level, update it to include staff.

---

## 5. Analytics Reports: Working Buttons (Date Range + Export by DELTA)

### 5.1 "Last 6 Months" Button
- **File:** `src/components/dashboard/AnalyticsReportsSection.tsx`
- The section already fetches with `?months=6`. Make the "Last 6 Months" button reflect the current range (e.g. display "Last 6 Months" as active) and optionally allow switching to 3 months / 12 months by changing the `months` query param and re-fetching.

### 5.2 Export Report (PDF or Excel) for Specific DELTA Numbers
- **Requirement:** Admin/Staff can generate a report (PDF preferred, Excel optional) for **specific DELTA number(s)**. Report table:
  - **Customer name**
  - **All tracking numbers** for that customer (in the selected DELTA context: main trackingId + purchase tracking numbers for shipments in that DELTA).
  - **Sum of quantity** for each shipment (or per customer).
  - **Total weight** of the shipment (or total weight per customer for that DELTA).

### 5.3 Implementation Approach

#### A. Report Data API
- **New endpoint:** e.g. `GET /api/admin/reports/delta?deltaNumbers=DELTA1,DELTA2` or `POST /api/admin/reports/delta` with body `{ deltaNumbers: string[] }`.
- **Auth:** Admin and staff only.
- **Logic:**
  - Find all shipments where `deltaNumber` is in the given list.
  - Group by `userId` (customer). For each customer, return: customer name, list of tracking numbers (main + wholesale), per-shipment quantity and weight, and totals (sum of quantity, sum of weight) for that customer in that DELTA set.
- **Response:** JSON suitable for building the report table (e.g. `{ customers: [ { name, shipments: [ { trackingId, purchaseTrackingNumbers[], quantity, weight }, ... ], totalQuantity, totalWeight } ] }`).

#### B. UI for Export
- **File:** `src/components/dashboard/AnalyticsReportsSection.tsx`
- Add a way to select **DELTA number(s)** (e.g. dropdown or multi-select populated from recent/available DELTA numbers from analytics or a small API).
- "Export Report" button:
  - Calls the report API with selected DELTA number(s).
  - Then either:
    - **Client-side:** Use a library (e.g. `jspdf` + `jspdf-autotable` for PDF, or `xlsx` for Excel) to generate the file and trigger download, or
    - **Server-side:** Implement `GET /api/admin/reports/export?format=pdf&deltaNumbers=...` that returns a PDF (or Excel) file using the same report data.

#### C. Report Content (Table)
- Columns: **Customer Name** | **Tracking Numbers** (comma-separated or line-break) | **Quantity (sum)** | **Total Weight (kg)**. Optionally one row per shipment with customer name repeated. Prefer one row per customer with aggregated tracking numbers, total quantity, total weight.

---

## 6. Order of Implementation (Suggested)

1. Create Shipment Modal updates (1.1–1.4), including API change for Vercel Blob documents.
2. Bulk update DELTA number (2.1–2.2).
3. User dashboard warehouse table: API (3.2) then UI (3.3).
4. Staff access to Analytics (4.1–4.3).
5. Analytics report data API (5.3 A), then Export button and DELTA selection (5.3 B–C).

---

## 7. Files Touched Summary

| Area | Files |
|------|--------|
| Create Shipment | `CreateShipmentModal.tsx`, `api/admin/shipments/route.ts`, optionally `models/Shipment.ts` / types for documents |
| Bulk Update | `BulkUpdateShipmentModal.tsx`, `api/admin/shipments/bulk-update/route.ts` |
| User Dashboard Table | `api/user/stats/route.ts` or new `api/user/warehouse-tracking/route.ts`, `DashboardOverview.tsx` |
| Staff + Analytics | `api/admin/analytics/route.ts`, `AdminDashboardLayout.tsx` |
| Reports Export | `api/admin/reports/delta/route.ts` (or similar), `api/admin/reports/export/route.ts` (optional), `AnalyticsReportsSection.tsx` |

---

## 8. Notes

- **Pricing/Service types:** The app currently maps `standard` = air, `express` = express air, `overnight` = sea. For "only Air and Shipping", use `standard` (Air) and `overnight` (Shipping); you can hide or remove `express` from the create form.
- **Declared value:** If the database or model requires `declaredValue`, set it to `0` when not provided in create shipment.
- **Documents schema:** When moving to Blob, decide whether to keep storing base64 in DB for old documents (backward compatibility) or migrate. New documents should store only URL and metadata.
