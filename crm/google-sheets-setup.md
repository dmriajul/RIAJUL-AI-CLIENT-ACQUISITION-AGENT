# Google Sheets Integration Setup Guide

> Phase 6A — Persistent CRM Implementation
> Step-by-step guide to connect Google Sheets API

---

## 🚨 BLOCKER: Google Sheets Not Connected

**Current Status:**
- ✅ CRM schema defined and ready
- ✅ All operations specified
- ✅ Validation rules documented
- ✅ Test suite created
- ❌ **Google Sheets API NOT connected**
- ❌ Cannot execute real CRM operations

**To unblock:** Follow this guide to connect Google Sheets API.

---

## Overview

To enable persistent CRM storage, you need:
1. Google Cloud service account with Google Sheets API access
2. CRM Google Sheet created and shared with service account
3. Credentials configured in the Agent environment

---

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com
- Sign in with your Google account (the one you want CRM on)

### 1.2 Create New Project
- Click project dropdown at top
- Click "NEW PROJECT"
- Name: `Riajul CRM Integration`
- Click "CREATE"
- Wait for project to be created (30 seconds)

### 1.3 Enable Google Sheets API
- In left sidebar: "APIs & Services" → "Library"
- Search for: "Google Sheets API"
- Click "Google Sheets API"
- Click "ENABLE"
- Wait for API to be enabled

### 1.4 Enable Google Drive API (for file management)
- Go back to API Library
- Search for: "Google Drive API"
- Click "Google Drive API"
- Click "ENABLE"

---

## Step 2: Create Service Account

### 2.1 Go to Service Accounts
- In left sidebar: "APIs & Services" → "Credentials"
- Click "+ CREATE CREDENTIALS"
- Select "Service account"

### 2.2 Configure Service Account
- **Name:** `crm-agent`
- **ID:** (auto-generated)
- **Description:** `Client Acquisition CRM Agent`
- Click "CREATE AND CONTINUE"

### 2.3 Grant Access (Optional)
- Role: You can skip this for now
- Click "CONTINUE"
- Click "DONE"

### 2.4 Create Key
- Find your new service account in the list
- Click on it
- Go to "KEYS" tab
- Click "ADD KEY" → "Create new key"
- Select: **JSON**
- Click "CREATE"
- **DOWNLOAD the JSON file** — this is your credentials file
- **KEEP THIS FILE SECURE** — it provides API access

### 2.5 Note Service Account Email
- Go back to service accounts list
- Copy the email address for `crm-agent`
- It looks like: `crm-agent@riajul-crm-integration.iam.gserviceaccount.com`
- **You'll need this in Step 4**

---

## Step 3: Create CRM Google Sheet

### 3.1 Create New Google Sheet
- Go to: https://sheets.google.com
- Click "+ Blank" to create new sheet
- Name it: `Riajul Client Acquisition CRM`

### 3.2 Create 10 Sheet Tabs

Create these tabs (sheets) inside the spreadsheet:

1. **Companies**
2. **Contacts**
3. **Prospects**
4. **Conversations**
5. **Reply Analysis**
6. **Follow-ups**
7. **Meetings**
8. **Proposals**
9. **Metrics**
10. **Audit Log**

To create tabs:
- Click "+" at bottom left to add new sheet
- Double-click tab name to rename

### 3.3 Copy Spreadsheet ID
- Look at the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
- Copy the `[SPREADSHEET_ID]` part
- **You'll need this in the Agent configuration**

### 3.4 Share Sheet with Service Account
- Click "Share" button (top right)
- Paste service account email: `crm-agent@riajul-crm-integration.iam.gserviceaccount.com`
- Set permission: **Editor**
- Click "Send"
- (The service account doesn't need to "accept" — it has access immediately)

---

## Step 4: Configure Agent Environment

### Option A: Environment Variable (Recommended)

Set the credentials as an environment variable:

```bash
# Save the JSON key file content
export GOOGLE_SHEETS_CREDENTIALS='{"type":"service_account","project_id":"...", ...}'

# Or point to the file
export GOOGLE_APPLICATION_CREDENTIALS='/path/to/service-account-key.json'

# Set spreadsheet ID
export CRM_SPREADSHEET_ID='your-spreadsheet-id-here'
```

### Option B: Config File

Create a config file in the project:

```
crm/
├── credentials.json    ← Service account key (DO NOT COMMIT TO GIT)
└── config.json         ← Spreadsheet ID and settings
```

**config.json:**
```json
{
  "spreadsheet_id": "your-spreadsheet-id-here",
  "credentials_file": "credentials.json",
  "sheet_names": {
    "companies": "Companies",
    "contacts": "Contacts",
    "prospects": "Prospects",
    "conversations": "Conversations",
    "reply_analysis": "Reply Analysis",
    "followups": "Follow-ups",
    "meetings": "Meetings",
    "proposals": "Proposals",
    "metrics": "Metrics",
    "audit_log": "Audit Log"
  }
}
```

**⚠️ IMPORTANT: Add to .gitignore:**
```
crm/credentials.json
```

---

## Step 5: Verify Connection

### Test Script
```
Command: Test CRM connection
Action: Verify Google Sheets API is accessible
Expected: Connection successful
```

### Manual Test
1. Read the Companies sheet (should be empty)
2. Write a test row
3. Read it back
4. Delete test row
5. Confirm read/write works

---

## Step 6: Initialize CRM Structure

Once connected:

```
Command: Initialize CRM
Action: Set up column headers and validation for all 10 sheets
Expected: All sheets configured
```

This will:
1. Add column headers to each sheet (matching schema.json)
2. Set up data validation rules
3. Configure ID generation
4. Test read/write operations

---

## Step 7: Migrate Test Data

```
Command: Migrate test data
Action: Load verified prospects from audits/ into CRM
Expected: 4 companies, 4 contacts, 4 prospects migrated
```

See: `crm/migration-plan.md` for details.

---

## Step 8: Run Validation Tests

```
Command: Run CRM validation tests
Action: Execute all 12 test scenarios
Expected: All 12 tests pass
```

See: `crm/test-suite.md` for test details.

---

## Troubleshooting

### Error: "Permission denied"
**Cause:** Service account doesn't have access to spreadsheet
**Fix:** Share spreadsheet with service account email as Editor

### Error: "API not enabled"
**Cause:** Google Sheets API not enabled in project
**Fix:** Go to API Library and enable Google Sheets API

### Error: "Invalid credentials"
**Cause:** Credentials file malformed or expired
**Fix:** Re-download service account key JSON

### Error: "Spreadsheet not found"
**Cause:** Wrong spreadsheet ID
**Fix:** Copy correct ID from spreadsheet URL

### Error: "Quota exceeded"
**Cause:** Too many API requests
**Fix:** Wait for quota to reset (usually 1 minute) or request quota increase

---

## Security Best Practices

1. **Never commit credentials to Git**
   - Add `credentials.json` to `.gitignore`
   - Use environment variables in production

2. **Limit service account permissions**
   - Only grant access to CRM spreadsheet
   - Don't give project-level admin access

3. **Monitor API usage**
   - Check Google Cloud Console for unusual activity
   - Set up billing alerts if needed

4. **Rotate credentials periodically**
   - Create new key every 90 days
   - Delete old keys after rotation

5. **Use separate Google account**
   - Consider using a dedicated Google account for CRM
   - Separates personal and business data

---

## Cost

**Google Sheets API:** Free (within quota limits)
- 60 requests per minute per user
- 300 requests per minute per project
- Should be sufficient for CRM operations

**Google Cloud:** Free tier available
- Service accounts: Free
- API calls: Free within quota

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Create Google Cloud project | 5 min | ❌ Not started |
| Enable APIs | 2 min | ❌ Not started |
| Create service account | 5 min | ❌ Not started |
| Download credentials | 2 min | ❌ Not started |
| Create CRM spreadsheet | 5 min | ❌ Not started |
| Share with service account | 2 min | ❌ Not started |
| Configure Agent environment | 5 min | ❌ Not started |
| Test connection | 5 min | ❌ Not started |
| **Total** | **~30 min** | |

---

## After Connection

Once Google Sheets is connected:
1. Initialize CRM structure (headers + validation)
2. Migrate test data (4 prospects)
3. Run validation tests (12 scenarios)
4. Begin using CRM for real prospect tracking
5. Generate daily metrics

---

## Support

If you encounter issues:
1. Check troubleshooting section above
2. Review Google Sheets API documentation: https://developers.google.com/sheets/api
3. Contact Arena.ai support for Agent-specific issues

---

**Next Action:** Complete Steps 1-4 to connect Google Sheets, then run `Initialize CRM` command.
