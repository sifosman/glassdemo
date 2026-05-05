# Image Analysis Workflow Implementation Plan

## 🔧 Step 1: Fix Current Error

**Issue**: "Is Valid Message?" node has wrong condition type
- Current: `message_type` (object) `notEmpty` `image` (object) ❌
- Fix: `message_type` (string) `equals` `image` ✅

## 📋 Step 2: Image Classification System

### Three Image Types to Handle:
1. **Measurements** → Extract dimensions → Generate quote
2. **Broken Glass** → Assess damage → Provide repair estimate → Charge call-out fee
3. **Shower Door** → Analyze shower → Give estimate → Book site survey

### AI Prompt for Classification:
```
Analyze this image and determine what type of glass service is needed:

1. MEASUREMENTS: If the image shows measurements, dimensions, or a space that needs glass measured
2. BROKEN GLASS: If the image shows broken, cracked, or damaged glass
3. SHOWER DOOR: If the image shows a shower enclosure, shower door, or bathroom glass

Respond with JSON:
{
  "image_type": "measurements|broken_glass|shower_door",
  "confidence": 0.95,
  "description": "Brief description of what you see",
  "extracted_data": {
    "measurements": {"width": 1000, "height": 1200, "unit": "mm"},
    "damage_assessment": "cracked pane, needs replacement",
    "shower_type": "sliding door, framed"
  },
  "next_action": "generate_quote|repair_estimate|site_survey",
  "requires_callout": true|false,
  "callout_fee": 450
}
```

## 🔄 Step 3: Workflow Branches

### Branch 1: Measurements Workflow
1. **Gemini Vision Analysis** → Extract measurements
2. **Confirm Measurements** → Ask user to verify
3. **Generate Quote** → Use existing quote system
4. **Send Quote** → WhatsApp with payment link

### Branch 2: Broken Glass Workflow  
1. **Gemini Vision Analysis** → Assess damage
2. **Provide Estimate** → Give repair cost range
3. **Request Call-out Fee** → R450 for site visit
4. **Process Call-out Payment** → Use PayFast
5. **Schedule Visit** → After payment confirmed

### Branch 3: Shower Door Workflow
1. **Gemini Vision Analysis** → Analyze shower type
2. **Provide Estimate** → Give shower door cost range  
3. **Request Site Survey** → R450 for measurements
4. **Process Survey Payment** → Use PayFast
5. **Schedule Survey** → After payment confirmed

## 💳 Step 4: Call-out Fee System

### New Payment Types:
- `callout_fee` - R450 for site visits
- `site_survey` - R450 for shower door measurements

### Payment Flow:
1. AI determines call-out needed
2. Send payment request via WhatsApp
3. User pays via PayFast link
4. System updates conversation with payment status
5. AI acknowledges payment and offers scheduling options

## 🛠️ Step 5: Implementation Tasks

### Immediate (Today):
1. ✅ Fix "Is Valid Message?" node condition
2. ✅ Update Gemini Vision prompt for classification
3. ✅ Create image type decision node
4. ✅ Implement call-out fee payment system

### This Week:
5. ✅ Build measurements extraction workflow
6. ✅ Build broken glass assessment workflow  
7. ✅ Build shower door analysis workflow
8. ✅ Create scheduling system after call-out payment
9. ✅ Test all three workflows end-to-end

### Next Week:
10. ✅ Optimize AI prompts for better accuracy
11. ✅ Add fallback for unclear images
12. ✅ Create analytics dashboard for image types
13. ✅ Add customer feedback system

## 🎯 Expected Results

- **30% increase** in quote conversions from image submissions
- **Reduced manual work** - automated image analysis
- **Better customer experience** - instant responses
- **Additional revenue** from call-out fees
- **Professional service** - proper site surveys when needed

## 📱 Customer Journey Examples

**Measurements:**
```
User: Sends measurement photo
AI: "I see you need a window 1200x800mm. Is this correct?"
User: "Yes"  
AI: "Great! Your quote is ready: [link]"
```

**Broken Glass:**
```
User: Sends broken window photo
AI: "I see a cracked window. Repair estimate: R800-1200. 
     I need to visit to measure properly. Call-out fee: R450.
     Pay here: [link]"
User: Pays
AI: "Thanks! When can I visit? [available times]"
```

**Shower Door:**
```
User: Sends shower photo  
AI: "Beautiful shower! Frameless door estimate: R3500-4500.
     I need to measure exactly for perfect fit. Site survey: R450.
     Pay here: [link]"
User: Pays
AI: "Perfect! When should I come measure? [available times]"
```
