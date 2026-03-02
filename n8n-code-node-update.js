// ==========================================
// N8N CODE NODE - Updated for Checkout Integration
// ==========================================
// Copy this into your n8n Code Node after the Parse and Calculate node

const geminiText = $('Google Gemini').first().json.content.parts[0].text;
const distanceMeters = $('Calculate Distance via Google Maps').first().json.rows[0].elements[0].distance.value; 
const durationText = $('Calculate Distance via Google Maps').first().json.rows[0].elements[0].duration.text; 

const baseCallOutFee = 350; 
const costPerKm = 6.50;
const materialsFitting = 1850;

// Parse Gemini Data
const cleanJson = String(geminiText).replace(/```json/gi, '').replace(/```/g, '').trim();
const parsedData = JSON.parse(cleanJson);

const distanceKm = (Number(distanceMeters) / 1000).toFixed(2);
const callOutFee = (baseCallOutFee + (parseFloat(distanceKm) * costPerKm)).toFixed(2);
const totalPrice = (parseFloat(callOutFee) + materialsFitting).toFixed(2);

// Remove "Aluminum" hardcoding to match Gemini's output better
const systemDescription = `${parsedData.frame_finish} ${parsedData.type}`;

const safetyNote = parsedData.safety_upgrade_required 
  ? '⚠️ Safety Note: The break pattern shows this was standard glass. By law (SANS 10400-N), we must replace this with 6.38mm Safety Glass.'
  : '✅ Safety Note: The break pattern confirms this was safety glass. We will replace it with matching SANS-approved glass.';

const expertAdvice = parsedData.expert_advice || "Our technician will assess the frame on-site to ensure a perfect fit.";

// Return all variables needed for the message template AND the API call
return [{
  json: {
    // For WhatsApp message
    distance_km: distanceKm,
    duration: durationText,
    system_description: systemDescription,
    safety_note: safetyNote,
    expert_advice: expertAdvice,
    call_out_fee: callOutFee,
    materials_fitting: materialsFitting,
    total_price: totalPrice,
    
    // For API payload
    system_type: parsedData.type,
    glass_type: parsedData.glass_type,
    frame_finish: parsedData.frame_finish,
    hardware_damage: parsedData.hardware_damage,
    safety_upgrade_required: parsedData.safety_upgrade_required,
    base_call_out_fee: baseCallOutFee,
    cost_per_km: costPerKm,
    calculated_call_out_fee: parseFloat(callOutFee),
    
    // Customer data from webhook (adjust field names based on your BotSailor payload)
    customer_phone: $('Webhook').item.json.sender_number,
    customer_location: $('Webhook').item.json.location_name || null,
    customer_latitude: $('Webhook').item.json.latitude || null,
    customer_longitude: $('Webhook').item.json.longitude || null,
  }
}];
