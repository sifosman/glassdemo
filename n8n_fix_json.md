# Fixed JSON for n8n "Prepare Quote Payload" Node

## Clean JSON Body (Copy and Paste This)

```json
{
  "whatsappUserId": "{{$json.phone_number}}",
  "customer": {
    "name": "{{$json.context_data.customer_name}}",
    "phone": "{{$json.phone_number}}",
    "suburb": "{{$json.context_data.suburb}}"
  },
  "items": [
    {
      "width_mm": "{{$json.context_data.width}}",
      "height_mm": "{{$json.context_data.height}}",
      "type": "{{$json.context_data.opening_type}} {{$json.context_data.installation_type}}",
      "glassType": "{{$json.context_data.glass_type}}",
      "frameColor": "{{$json.context_data.frame_color}}",
      "thickness": "{{$json.context_data.thickness}}",
      "quantity": "{{$json.context_data.quantity}}",
      "opening_mechanism": "{{$json.context_data.opening_mechanism}}"
    }
  ]
}
```

## Alternative: Use Set Node First

If the above doesn't work, create a "Set" node before "Prepare Quote Payload" with:

```
whatsappUserId = {{$json.phone_number}}
customer_name = {{$json.context_data.customer_name}}
customer_phone = {{$json.phone_number}}
customer_suburb = {{$json.context_data.suburb}}
item_width = {{$json.context_data.width}}
item_height = {{$json.context_data.height}}
item_type = {{$json.context_data.opening_type}} {{$json.context_data.installation_type}}
item_glass_type = {{$json.context_data.glass_type}}
item_frame_color = {{$json.context_data.frame_color}}
item_thickness = {{$json.context_data.thickness}}
item_quantity = {{$json.context_data.quantity}}
item_opening_mechanism = {{$json.context_data.opening_mechanism}}
```

Then use this simpler JSON in "Prepare Quote Payload":

```json
{
  "whatsappUserId": "{{$json.whatsappUserId}}",
  "customer": {
    "name": "{{$json.customer_name}}",
    "phone": "{{$json.customer_phone}}",
    "suburb": "{{$json.customer_suburb}}"
  },
  "items": [
    {
      "width_mm": "{{$json.item_width}}",
      "height_mm": "{{$json.item_height}}",
      "type": "{{$json.item_type}}",
      "glassType": "{{$json.item_glass_type}}",
      "frameColor": "{{$json.item_frame_color}}",
      "thickness": "{{$json.item_thickness}}",
      "quantity": "{{$json.item_quantity}}",
      "opening_mechanism": "{{$json.item_opening_mechanism}}"
    }
  ]
}
```

## Key Changes
- Removed complex JavaScript expressions that cause parsing errors
- Used simple n8n expression syntax `{{$json.field_name}}`
- Added fallbacks for missing values
- Much cleaner and easier to debug
