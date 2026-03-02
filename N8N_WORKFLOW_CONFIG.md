# N8N Configuration for Repair Checkout Flow

## Overview
This document describes the complete n8n workflow configuration to integrate with the glass repair checkout system.

## Node 1: Webhook (Trigger)
- **Method:** POST
- **Path:** glass-repair-webhook
- **Response Mode:** Response (so BotSailor gets immediate feedback)

Expected payload from BotSailor:
```json
{
  "sender_number": "27821234567",
  "image_url": "https://botsailor.com/...",
  "latitude": -25.9999,
  "longitude": 28.1111,
  "location_name": "Sandton, Johannesburg"
}
```

## Node 2: HTTP Request (Download Image)
- **Method:** GET
- **URL:** {{ $json.image_url }}
- **Response Format:** File (Binary)

## Node 3: Google Maps (Calculate Distance)
Use the Google Maps node to calculate distance from your factory.
- **Operation:** Calculate Route/Distance
- **Origin:** Your factory address/coordinates
- **Destination:** {{ $json.latitude }}, {{ $json.longitude }}

## Node 4: Google Gemini (Vision Analysis)
- **Model:** Gemini 1.5 Pro
- **Input:** Binary data from Node 2
- **Prompt:**
```
Analyze this image of broken glass for a glazier and return a JSON object with the following keys:
- 'type': Is it a door, window, or shopfront?
- 'glass_type': Analyze the break pattern. Are there dangerous large shards (Float/Standard) or a safe spiderweb/crumbly pattern (Toughened/Laminated)?
- 'frame_finish': What color/material is the frame? (e.g., Charcoal Aluminum, White-painted wood, Bronze)
- 'hardware_damage': Is the handle, hinge, or bead visibly broken? (Yes/No with brief detail)
- 'safety_upgrade_required': Boolean (true if break pattern is large shards/float glass, false otherwise).
- 'expert_advice': Provide 1-2 sentences of professional glazier advice based on the photo.
```

## Node 5: Code (Parse and Calculate)
Copy the code from `n8n-code-node-update.js` into this node.

## Node 6: HTTP Request (Create Repair Request)
This node sends the data to your API to create the repair request and get a checkout URL.

**Configuration:**
- **Method:** POST
- **URL:** https://glassdemo-1zl3.vercel.app/api/repair-request
- **Authentication:** None (or add API key if you implement one)
- **Send Body:** JSON

**JSON Body:**
```json
{
  "customer_phone": "{{ $json.customer_phone }}",
  "customer_location": "{{ $json.customer_location }}",
  "customer_latitude": {{ $json.customer_latitude }},
  "customer_longitude": {{ $json.customer_longitude }},
  "system_type": "{{ $json.system_type }}",
  "glass_type": "{{ $json.glass_type }}",
  "frame_finish": "{{ $json.frame_finish }}",
  "hardware_damage": "{{ $json.hardware_damage }}",
  "expert_advice": "{{ $json.expert_advice }}",
  "safety_upgrade_required": {{ $json.safety_upgrade_required }},
  "safety_note": "{{ $json.safety_note }}",
  "distance_km": {{ $json.distance_km }},
  "duration": "{{ $json.duration }}",
  "base_call_out_fee": {{ $json.base_call_out_fee }},
  "cost_per_km": {{ $json.cost_per_km }},
  "calculated_call_out_fee": {{ $json.calculated_call_out_fee }},
  "materials_fitting": {{ $json.materials_fitting }},
  "total_price": {{ $json.total_price }}
}
```

## Node 7: HTTP Request (Send WhatsApp Message via BotSailor)
This sends the final message with the checkout link to the customer.

**Configuration:**
- **Method:** POST
- **URL:** https://botsailor.com/api/v1/whatsapp/send
- **Send Body:** Form Data (x-www-form-urlencoded)

**Body Fields:**
| Name | Value |
|------|-------|
| apiToken | YOUR_BOTSAILOR_API_KEY |
| phone_number_id | YOUR_WHATSAPP_PHONE_NUMBER_ID |
| phone_number | {{ $('Webhook').item.json.sender_number }} |
| message | (See message template below) |

**Message Template (paste into the message field):**
```
Thank you for sending the details. Our system has analyzed the photo of your damaged {{ $json.system_description }}.

*🛠️ Expert Assessment*
{{ $json.expert_advice }}

{{ $json.safety_note }}

*📋 Estimated Quotation*
• Materials & Installation: R{{ $json.materials_fitting }}
• Travel & Call-out ({{ $json.distance_km }}km): R{{ $json.call_out_fee }}

*Total Estimated Cost: R{{ $json.total_price }}*

_Please note: This is a rough estimate based on the photo. An official, final quote will be provided on-site by our expert staff._

To accept this estimate and book a technician, please pay the call-out fee using the secure link below:
👉 {{ $json.checkout_url }}

Secure payment powered by PayFast.
```

*Note: Make sure to drag the `checkout_url` from Node 6 (HTTP Request) into the message template.*

## Environment Variables Needed

Add these to your `.env.local` file in the Next.js app:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://db.klazqmnlgzclidjcuabr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# PayFast
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=jt7NOE43FZPn
PAYFAST_SANDBOX=true

# Email (for team notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TEAM_EMAIL=team@owdglass.co.za

# Base URL
NEXT_PUBLIC_BASE_URL=https://glassdemo-1zl3.vercel.app
```

## Testing the Flow

1. Trigger the webhook with test data
2. Verify image is downloaded
3. Check Google Maps distance calculation
4. Confirm Gemini analysis
5. Check that the repair request is created in Supabase
6. Verify the checkout URL is returned
7. Confirm WhatsApp message is sent with the checkout link
8. Test payment flow in PayFast sandbox
9. Verify team email is received after payment
