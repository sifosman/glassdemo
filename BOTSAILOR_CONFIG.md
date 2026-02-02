# BotSailor API Configuration Template

## Required Environment Variables

Add these to your `.env.local` file:

```env
# BotSailor WhatsApp Integration
BOTSAILOR_API_BASE_URL=https://api.botsailor.com
BOTSAILOR_API_KEY=your_botsailor_api_key_here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Custom business details for PDF headers
BUSINESS_NAME=OWD Glass
BUSINESS_EMAIL=info@owdglass.co.za
BUSINESS_PHONE=+27 12 345 6789
```

## BotSailor API Setup

### 1. Get Your API Key

1. Login to your BotSailor dashboard
2. Navigate to Settings → API Keys
3. Generate a new API key
4. Copy the key and replace `your_botsailor_api_key_here` above

### 2. Configure Webhook URL

In your BotSailor dashboard:
- Set webhook URL to: `https://your-domain.com/api/generate-quote`
- Choose POST method
- Enable JSON payload support

### 3. Message Templates

The system uses these message templates automatically:

#### File Message (PDF)
```json
{
  "recipient": "whatsapp_user_id",
  "type": "file",
  "file": {
    "url": "pdf_url_here",
    "filename": "quote_reference.pdf"
  },
  "message": "Your glass quotation [REFERENCE] is ready. Please find the detailed quote attached."
}
```

#### Text Message (Optional)
```json
{
  "recipient": "whatsapp_user_id", 
  "type": "text",
  "message": "Your custom message here"
}
```

## BotSailor API Endpoints Used

### Send File Message
```
POST https://api.botsailor.com/v1/messages/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Send Text Message  
```
POST https://api.botsailor.com/v1/messages/send
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## Testing BotSailor Integration

### Test with cURL
```bash
curl -X POST https://api.botsailor.com/v1/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "27821234567",
    "type": "text",
    "message": "Test message from Glass Quote Engine"
  }'
```

### Test File Message
```bash
curl -X POST https://api.botsailor.com/v1/messages/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "27821234567",
    "type": "file",
    "file": {
      "url": "https://example.com/test.pdf",
      "filename": "test-quote.pdf"
    },
    "message": "Your test quote is ready"
  }'
```

## WhatsApp User ID Format

BotSailor expects WhatsApp user IDs in this format:
- South Africa: `27821234567` (country code + number, no + or spaces)
- International: `country_code_number` (e.g., `441234567890` for UK)

## Error Handling

The system handles these BotSailor errors:
- Invalid API key
- Rate limiting
- Invalid recipient numbers
- File upload failures

## Production Considerations

1. **API Security**: Never expose your API key in client-side code
2. **Rate Limits**: Monitor BotSailor rate limits (typically 100 messages/minute)
3. **Webhook Security**: Consider adding webhook signature verification
4. **Fallback**: Implement email fallback if WhatsApp fails

## Quick Setup Checklist

- [ ] Copy API key from BotSailor dashboard
- [ ] Add to `.env.local` file
- [ ] Set webhook URL in BotSailor
- [ ] Test with sample message
- [ ] Verify PDF delivery works
- [ ] Monitor error logs

## Support

If you encounter issues:
1. Check BotSailor API status
2. Verify API key is correct
3. Ensure webhook URL is accessible
4. Check WhatsApp number format
5. Review error logs in your application
