# Glass Quotation Engine API

A complete Next.js API endpoint for generating glass quotations with PDF generation and WhatsApp integration via BotSailor.

## Features

- **Pricing Calculation**: South African glazing standards compliant pricing
- **PDF Generation**: Professional quote documents with React PDF
- **WhatsApp Integration**: Automatic PDF delivery via BotSailor
- **TypeScript**: Full type safety and IntelliSense support

## API Endpoint

### POST `/api/generate-quote`

Accepts JSON payload and returns quote details with PDF URL.

#### Request Body

```json
{
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St, Johannesburg, SA"
  },
  "items": [
    {
      "width_mm": 1200,
      "height_mm": 800,
      "type": "window",
      "glassType": "Clear Float",
      "frameColor": "White"
    },
    {
      "width_mm": 2000,
      "height_mm": 2100,
      "type": "door",
      "glassType": "Toughened Safety",
      "frameColor": "Charcoal"
    }
  ],
  "whatsappUserId": "27821234567"
}
```

#### Response

```json
{
  "success": true,
  "quoteReference": "Q20250201-123",
  "pdfUrl": "http://localhost:3000/quotes/Q20250201-123.pdf",
  "totalAmount": 5425.67,
  "message": "Quote generated and sent successfully"
}
```

## Pricing Logic

### Base Rates
- **Standard Windows**: R1,300 per m²
- **Doors/Safety Zones**: R1,800 per m²

### Rules
1. **Minimum Area**: Every item billed for minimum 0.25m²
2. **Color Surcharge**: 15% surcharge for non-white frames (Charcoal, etc.)
3. **Glazing Certificate**: Fixed fee of R368.49
4. **VAT**: 15% VAT on subtotal after all fees

### Calculation Example

For a 1200x800mm window with white frame:
- Area: 0.96m² (above minimum, so billed for actual area)
- Base price: 0.96 × R1,300 = R1,248
- No surcharge (white frame)
- Subtotal: R1,248
- Certificate: +R368.49 = R1,616.49
- VAT (15%): +R242.47 = R1,858.96

## Setup Instructions

### 1. Install Dependencies

```bash
npm install axios uuid @react-pdf/renderer
```

### 2. Environment Variables

Copy `env.example` to `.env.local` and configure:

```env
BOTSAILOR_API_BASE_URL=https://api.botsailor.com
BOTSAILOR_API_KEY=your_actual_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Create Quotes Directory

```bash
mkdir -p public/quotes
```

### 4. Start Development Server

```bash
npm run dev
```

## BotSailor Integration

The API automatically sends generated PDFs to WhatsApp users via BotSailor.

### Required BotSailor Setup

1. **API Key**: Get from BotSailor dashboard
2. **Webhook URL**: Configure to point to your API endpoint
3. **Message Templates**: Set up file message templates

### BotSailor API Endpoints Used

- `POST /v1/messages/send` - For sending PDF files
- `POST /v1/messages/send` - For sending text messages

## File Structure

```
src/
├── app/
│   └── api/
│       └── generate-quote/
│           └── route.ts          # Main API endpoint
├── services/
│   ├── glassQuoteService.ts      # Pricing calculations
│   ├── pdfService.tsx           # PDF generation
│   └── botSailorService.ts      # WhatsApp integration
public/
└── quotes/                      # Generated PDF storage
```

## Testing with n8n

### Sample n8n HTTP Request Node

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/generate-quote",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "customer": {
      "name": "{{$json.customerName}}",
      "email": "{{$json.customerEmail}}",
      "address": "{{$json.customerAddress}}"
    },
    "items": "{{$json.items}}",
    "whatsappUserId": "{{$json.whatsappUserId}}"
  }
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- **400**: Bad Request (missing/invalid data)
- **500**: Internal Server Error (PDF generation, API failures)

### Error Response Format

```json
{
  "error": "Error description"
}
```

## PDF Features

Generated PDFs include:

- Professional business header
- Customer details and quote reference
- Itemized pricing table
- VAT and surcharge breakdown
- SANS 10400-N compliance notice
- 10-day validity statement

## Security Considerations

1. **API Key Security**: Store BotSailor API key in environment variables
2. **Input Validation**: API validates all required fields
3. **File Access**: PDFs stored in public directory with predictable naming
4. **Rate Limiting**: Consider implementing rate limiting for production

## Production Deployment

1. **Environment Variables**: Set all required env vars
2. **File Storage**: Consider cloud storage for PDFs in production
3. **Domain**: Update `NEXT_PUBLIC_BASE_URL` to production domain
4. **HTTPS**: Ensure BotSailor webhooks use HTTPS
5. **Monitoring**: Add logging and error monitoring

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**: Check React PDF dependencies
2. **BotSailor API Errors**: Verify API key and endpoint URLs
3. **File Not Found**: Ensure `public/quotes` directory exists
4. **Import Errors**: Check TypeScript configuration for .tsx files

### Debug Mode

Add console logging to services for debugging:

```typescript
console.log('Quote calculation:', quote);
console.log('PDF generated successfully');
console.log('BotSailor response:', response.data);
```

## Customization

### Business Details

Update PDF header in `pdfService.tsx`:

```typescript
<Text style={styles.businessName}>Your Business Name</Text>
<Text style={styles.businessInfo}>Your tagline | Compliance info</Text>
```

### Pricing Rules

Modify rates in `glassQuoteService.ts`:

```typescript
private readonly BASE_RATE_WINDOW = 1300; // Adjust base rate
private readonly SURCHARGE_RATE = 0.15;    // Adjust surcharge
```

### WhatsApp Messages

Customize messages in `botSailorService.ts`:

```typescript
message: `Your custom message for quote ${quoteReference}`
```
