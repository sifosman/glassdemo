# N8N WORKFLOW PROMPT FOR WHATSAPP REMINDERS

Please create an n8n workflow for sending automated WhatsApp reminders for unpaid repair quotes with the following specifications:

## Workflow Name
`Glass Repair - Payment Reminders (Hourly Check)`

## Workflow Description
Automatically sends WhatsApp reminders to customers who haven't paid for their repair quotes at 24 hours, 72 hours, and 7 days after the initial quote.

## Nodes Configuration

### Node 1: Schedule Trigger
- **Node Type**: Schedule Trigger
- **Node Name**: Hourly Check
- **Configuration**:
  - Trigger Interval: Every 1 hour
  - Trigger Times: `0 * * * *` (every hour on the hour)

### Node 2: Check Pending Reminders
- **Node Type**: HTTP Request
- **Node Name**: Check Pending Reminders
- **Configuration**:
  - Method: GET
  - URL: `https://glassdemo.vercel.app/api/reminders/check-pending`
  - Authentication: None
  - Options:
    - Response Format: JSON

### Node 3: Check if Reminders Exist
- **Node Type**: IF (Conditional)
- **Node Name**: Any Reminders to Send?
- **Configuration**:
  - Condition 1:
    - Field: `{{ $json.reminders_to_send }}`
    - Operation: Larger
    - Value: 0

### Node 4: Split Into Items
- **Node Type**: Split In Batches
- **Node Name**: Process Each Reminder
- **Configuration**:
  - Batch Size: 1
  - Options:
    - Reset: false
- **Connection**: Connect to TRUE branch of Node 3

### Node 5: Extract Reminder Data
- **Node Type**: Code (JavaScript)
- **Node Name**: Extract Reminder Data
- **Configuration**:
  - Mode: Run Once for Each Item
  - JavaScript Code:
```javascript
// Extract the first reminder from the pending_reminders array
const reminders = $input.item.json.pending_reminders;

if (!reminders || reminders.length === 0) {
  return [];
}

const reminder = reminders[$itemIndex] || reminders[0];

return {
  json: {
    repair_id: reminder.id,
    reminder_type: reminder.reminderType,
    reference_number: reminder.reference_number,
    customer_phone: reminder.customer_phone,
    system_type: reminder.system_type,
    call_out_fee: reminder.calculated_call_out_fee,
    hours_elapsed: reminder.hoursElapsed
  }
};
```

### Node 6: Send WhatsApp Reminder
- **Node Type**: HTTP Request
- **Node Name**: Send WhatsApp Reminder
- **Configuration**:
  - Method: POST
  - URL: `https://glassdemo.vercel.app/api/reminders/send`
  - Authentication: None
  - Send Body: Yes
  - Body Content Type: JSON
  - JSON Body:
```json
{
  "repair_id": "{{ $json.repair_id }}",
  "reminder_type": "{{ $json.reminder_type }}"
}
```
  - Options:
    - Response Format: JSON
    - Timeout: 30000

### Node 7: Log Success
- **Node Type**: Code (JavaScript)
- **Node Name**: Log Reminder Sent
- **Configuration**:
  - Mode: Run Once for Each Item
  - JavaScript Code:
```javascript
const reminderData = $input.first().json;
const response = $input.last().json;

console.log(`✅ Reminder sent successfully:
  Reference: ${reminderData.reference_number}
  Type: ${reminderData.reminder_type}
  Customer: ${reminderData.customer_phone}
  Hours Elapsed: ${reminderData.hours_elapsed}
`);

return {
  json: {
    success: true,
    ...reminderData,
    sent_at: new Date().toISOString(),
    api_response: response
  }
};
```

### Node 8: Handle Errors
- **Node Type**: Code (JavaScript)
- **Node Name**: Log Error
- **Configuration**:
  - Mode: Run Once for Each Item
  - Connect this to the error output of Node 6
  - JavaScript Code:
```javascript
const reminderData = $input.first().json;
const error = $input.last().json;

console.error(`❌ Failed to send reminder:
  Reference: ${reminderData.reference_number}
  Type: ${reminderData.reminder_type}
  Error: ${JSON.stringify(error)}
`);

return {
  json: {
    success: false,
    error: true,
    ...reminderData,
    error_details: error,
    failed_at: new Date().toISOString()
  }
};
```

### Node 9: Wait Between Requests
- **Node Type**: Wait
- **Node Name**: Rate Limit (2 seconds)
- **Configuration**:
  - Resume After: 2 seconds
- **Purpose**: Prevent rate limiting on WhatsApp API

## Workflow Connections

1. **Schedule Trigger** → **Check Pending Reminders**
2. **Check Pending Reminders** → **Any Reminders to Send?**
3. **Any Reminders to Send?** (TRUE) → **Process Each Reminder**
4. **Process Each Reminder** → **Extract Reminder Data**
5. **Extract Reminder Data** → **Send WhatsApp Reminder**
6. **Send WhatsApp Reminder** → **Log Reminder Sent**
7. **Log Reminder Sent** → **Wait Between Requests**
8. **Wait Between Requests** → **Process Each Reminder** (loop back for next item)
9. **Send WhatsApp Reminder** (On Error) → **Log Error**

## Environment Variables Required

These should already be set in your n8n environment or in the workflow configuration node:

- **API Base URL**: `https://glassdemo.vercel.app`
- **BotSailor API Token**: `17624|mrHKuEUJ3ugTwXrKNcPu3hmhj9wcxoY2YHTSbrE3048e937d`
- **BotSailor Phone Number ID**: `967736983089856`

## Testing the Workflow

### Manual Test
1. Activate the workflow
2. Click "Execute Workflow" button
3. Check the execution log to see pending reminders
4. Verify WhatsApp messages are sent

### Verify API Endpoints
Test the check endpoint manually:
```bash
curl https://glassdemo.vercel.app/api/reminders/check-pending
```

Expected response:
```json
{
  "success": true,
  "pending_reminders": [...],
  "total_pending": 5,
  "reminders_to_send": 2
}
```

## Reminder Schedule Logic

- **24-hour reminder**: Sent between 24-47 hours after quote creation
- **72-hour reminder**: Sent between 72-95 hours after quote creation (3 days)
- **7-day reminder**: Sent between 168-191 hours after quote creation (7 days)

Each reminder is only sent once. The database tracks which reminders have been sent to prevent duplicates.

## Important Notes

1. **Hourly execution**: The workflow runs every hour to check for pending reminders
2. **Rate limiting**: 2-second delay between each WhatsApp message to prevent API throttling
3. **Error handling**: Failed reminders are logged but don't stop the workflow
4. **Idempotent**: Each reminder can only be sent once per repair request
5. **Status check**: Only processes repair requests with status `pending_payment`

## Monitoring

Monitor these metrics in n8n:
- Total executions per day (should be 24)
- Success rate for WhatsApp sends
- Number of reminders sent per execution
- Failed reminder attempts (check error logs)

## Workflow Settings

- **Save Execution Data**: On Success and On Error
- **Timezone**: Africa/Johannesburg (SAST)
- **Error Workflow**: (Optional) Create a separate error notification workflow

## Alternative: Single API Call Approach

If you prefer a simpler workflow that processes all reminders in one API call, create this instead:

### Simplified Workflow (3 Nodes)

**Node 1**: Schedule Trigger (hourly)
**Node 2**: HTTP Request to `https://glassdemo.vercel.app/api/reminders/process-all`
**Node 3**: Code node to log results

This requires creating a new `/api/reminders/process-all` endpoint that internally loops through all pending reminders.

---

## Quick Start Command

Copy and paste this into n8n's "Import from URL or Text" feature:

*Note: The JSON export will be provided separately after workflow creation.*

## Support

If you encounter issues:
1. Check n8n execution logs
2. Verify API endpoints are accessible
3. Test WhatsApp credentials in BotSailor dashboard
4. Review Vercel function logs for API errors
