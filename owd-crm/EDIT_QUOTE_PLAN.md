# Edit Quote Implementation Plan

## 1. Overview
The Edit Quote feature will allow users to modify existing quotes, recalculate pricing, and regenerate the PDF document. It will mirror the quote generation logic from the original `glass-quote-app` while integrating with the new `owd-crm` Supabase multi-tenant schema.

## 2. Required Fields for Editing
Based on the `glass-quote-app` implementation, the edit form will need to capture and modify the following data structures:

### Customer Details
- Name
- Email
- Phone
- Installation Address

### Quote Details
- Project Description
- Installation Type
- Discount Percent / Amount

### Quote Items (Glass Items)
For each item in the quote, we need to allow editing of:
- `width_mm`: Width in millimeters
- `height_mm`: Height in millimeters
- `type`: 'window' or 'door'
- `glassType`: Type of glass (e.g., 'Clear', 'Tinted', 'Low-E')
- `frameColor`: Color of the aluminum frame
- `thickness`: Glass thickness (optional)

## 3. Implementation Steps

### Phase 1: Edit Quote UI Page
Create a new route: `/dashboard/quotes/[id]/edit/page.tsx`
- **Form State Management**: Use React Hook Form with Zod validation.
- **Data Fetching**: Load the existing quote, customer details, and quote items from Supabase.
- **Dynamic Items**: Implement a dynamic field array allowing users to add, remove, or modify individual glass items.

### Phase 2: Pricing Recalculation Logic
Port the `ProductPricingService` logic from the original app to `owd-crm`.
When items are edited, the system must recalculate:
- `area_m2` (width * height)
- Unit price based on glass type, frame color, and dimensions
- Requirements for safety glass (based on size/type)
- Subtotal, VAT (15%), and Final Total

### Phase 3: Server Action / API Update
Create a server action or API route to handle the update:
1. Update `customers` table (if customer details changed).
2. Update `quotes` table with new totals, discounts, and descriptions.
3. Delete removed `quote_items`, update existing ones, and insert new ones.

### Phase 4: PDF Regeneration
- After the database update is successful, trigger the PDF generation service.
- Generate a new PDF document with the updated details.
- Upload the new PDF to Supabase Storage, overwriting the old one or creating a new version.
- Update the `pdf_url` field on the quote record.

## 4. Next Steps
To begin, we should:
1. Port the pricing calculation utilities (`productPricingService.ts` and `glassQuoteService.ts` logic) into the `owd-crm/src/services` folder.
2. Build the Edit Quote UI form.
3. Wire up the update API and PDF regeneration.
