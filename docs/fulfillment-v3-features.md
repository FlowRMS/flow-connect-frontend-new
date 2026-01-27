# Fulfillment V3 Features - Frontend

## Overview

This release includes several enhancements to the fulfillment workflow, including document management, carrier type selection, shipment request integration, and status handling improvements.

---

## 1. Fulfillment Documents

### Description
Adds the ability to attach, view, and manage documents on fulfillment orders. Documents such as BOLs (Bills of Lading), packing slips, shipping labels, invoices, and photos can be uploaded and associated with specific fulfillment orders.

### Components Changed
- **DocumentsSection.tsx**: New component for displaying and managing documents
  - Supports file upload via drag-and-drop or file picker
  - Displays document list with type, filename, and upload date
  - Allows document deletion with confirmation
  - Document type selection (BOL, Packing Slip, Shipping Label, Invoice, Photo, Other)

- **FulfillmentOrderDetailContent.tsx**: Updated to include the DocumentsSection
  - Documents are fetched as part of the fulfillment order query
  - Automatic refresh after document upload/delete operations

- **ShipmentConfirmationModal.tsx**: Updated to display attached documents when confirming shipment

### GraphQL Operations
```graphql
mutation UploadFulfillmentDocument($input: UploadFulfillmentDocumentInput!) {
  uploadFulfillmentDocument(input: $input) {
    id
    documentType
    fileName
    fileUrl
    fileSize
    mimeType
    notes
    uploadedAt
    uploadedBy { id firstName lastName }
  }
}

mutation DeleteFulfillmentDocument($documentId: UUID!) {
  deleteFulfillmentDocument(documentId: $documentId)
}
```

---

## 2. Carrier Type Selection

### Description
Adds support for carrier type categorization (LTL, FTL, Parcel, Courier) to shipping carriers, with a dynamic carrier dropdown that filters by type.

### Components Changed
- **FulfillmentDetailsForm.tsx**: Added carrier type dropdown that filters available carriers
- **CarrierBasicInfo.tsx**: New component for carrier type selection in settings
- **ShippingCarrierAccordionItem.tsx**: Displays carrier type in carrier list

### API Changes
- `shippingCarriersApi.ts`: Added `getCarriersByType` query
- `useShippingCarriersApi.ts`: Added `useCarriersByType` hook

---

## 3. Shipment Request Integration

### Description
Integrates shipment requests with fulfillment orders, allowing warehouse staff to create and manage shipment requests from the fulfillment detail view.

### New Files
- **shipmentRequestApi.ts**: GraphQL operations for shipment requests
- **useShipmentRequestApi.ts**: React Query hooks for shipment requests

### Features
- Create shipment request from fulfillment order
- Link shipment request to fulfillment order
- Track shipment request status

---

## 4. COMMUNICATED Status Support

### Description
Adds support for the COMMUNICATED status in the fulfillment workflow, which indicates that shipment information has been communicated to the customer.

### Components Changed
- **FulfillmentOrderDetailContent.tsx**: Added "Mark Communicated" action button
- **fulfillmentApi.ts**: Added `markFulfillmentOrderCommunicated` mutation

---

## 5. Backorder and Inventory Tab Fixes

### Description
Fixes for backorder workflow and enables the Inventory tab in the sidebar.

### Components Changed
- **ManufacturerDirectModal.tsx**: Fixed backorder testing modal
- **SidebarConfigContext.tsx**: Enabled Inventory tab visibility

---

## 6. Audit Timestamps Enhancement

### Description
Improved audit timestamp display with timezone handling and better formatting.

### Components Changed
- **AuditTimestamps.tsx**: Enhanced timestamp display with proper timezone conversion

---

## File Storage

Documents are stored in AWS S3 under the path:
```
fulfillment/{fulfillment_order_id}/documents/{filename}
```

Files are tracked in the `pyfiles.files` table for centralized file management, with the `file_id` foreign key linking the document record to the file record.
