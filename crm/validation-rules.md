# CRM Validation Rules — Data Integrity Controls

> Phase 6A — Persistent CRM Implementation
> Every CRM operation must pass these validations before executing

---

## Validation Philosophy

1. **Block early** — Validate before any data mutation
2. **Explain clearly** — Return exact reason for failure
3. **No silent failures** — Every validation failure must be reported
4. **Prevent corruption** — Never allow invalid data into CRM
5. **Preserve compliance** — DO_NOT_CONTACT is absolute

---

## 1. Required Field Validation

Every CREATE/UPDATE operation checks required fields are present and non-empty.

### Companies — Required
| Field | Check | Error Message |
|-------|-------|---------------|
| Company Name | Not blank | "Company Name is required" |
| Status | Must be set | "Status must be set" |

### Contacts — Required
| Field | Check | Error Message |
|-------|-------|---------------|
| Company ID | Must exist in Companies | "Company ID [X] does not exist" |
| Status | Must be set | "Status must be set" |

### Prospects — Required
| Field | Check | Error Message |
|-------|-------|---------------|
| Contact ID | Must exist in Contacts | "Contact ID [X] does not exist" |
| Company ID | Must exist in Companies | "Company ID [X] does not exist" |
| Priority | Must be A/B/C | "Priority must be A, B, or C (got: [X])" |
| Priority Reason | Not blank | "Priority Reason is required" |
| ICP Segment | Must be Primary/Secondary/Tertiary | "Invalid ICP Segment: [X]" |
| Service | Must be valid service | "Invalid service: [X]" |
| Opportunity | Not blank | "Opportunity is required (evidence-based)" |
| Research Evidence | Not blank | "Research Evidence is required (verified observations)" |
| Portfolio Proof | Not blank | "Portfolio Proof is required (matching case studies)" |
| Pipeline Stage | Must be valid stage | "Invalid pipeline stage: [X]" |
| Owner | Not blank | "Owner is required" |

### Conversations — Required
| Field | Check | Error Message |
|-------|-------|---------------|
| Prospect ID | Must exist | "Prospect ID [X] does not exist" |
| Message Type | Outbound or Inbound | "Message Type must be Outbound or Inbound" |
| Message Channel | Email or LinkedIn | "Message Channel must be Email or LinkedIn" |
| Message Date | Valid date | "Message Date must be a valid date" |
| Message Content | Not blank | "Message Content is required" |
| Human Approved | Boolean | "Human Approved must be true or false" |

### Reply Analysis — Required
| Field | Check | Error Message |
|-------|-------|---------------|
| Conversation ID | Must exist | "Conversation ID [X] does not exist" |
| Prospect ID | Must exist | "Prospect ID [X] does not exist" |
| Reply Date | Valid date | "Reply Date must be valid" |
| Reply Content | Not blank | "Reply Content is required" |
| Classification | One of 13 categories | "Invalid classification: [X]" |
| Sentiment | Positive/Neutral/Negative/Mixed | "Invalid sentiment: [X]" |
| Interest Level | High/Medium/Low/None | "Invalid interest level: [X]" |
| Urgency | High/Medium/Low/None | "Invalid urgency: [X]" |
| Recommended Action | Not blank | "Recommended Action is required" |

---

## 2. Enum Validation

### Valid Pipeline Stages
```
NEW, RESEARCHED, QUALIFIED, OUTREACH_READY, CONTACTED,
FOLLOW-UP 1, FOLLOW-UP 2, REPLIED, CONVERSATION,
MEETING, PROPOSAL, NEGOTIATION, WON, LOST, NURTURE, DISQUALIFIED
```

### Valid Stage Modifiers
```
DO_NOT_CONTACT, REFERRED, MULTI_CONTACT, RE_ENGAGING, AT_RISK
```

### Valid Priority Values
```
A, B, C
```

### Valid ICP Segments
```
Primary, Secondary, Tertiary
```

### Valid Service Names
```
Meta Ads Management
Social Media Management
Google Ads Management
SEO
Local SEO & ORM
Analytics & Tracking
CRO
Combined Package
```

### Valid Sentiment Values
```
Positive, Neutral, Negative, Mixed
```

### Valid Interest Levels
```
High, Medium, Low, None
```

### Valid Urgency Values
```
High, Medium, Low, None
```

### Valid Decision Maker Status
```
Decision-maker, Influencer, Gatekeeper, Unknown
```

### Valid Company Sizes
```
1-10, 11-50, 51-200, 201-500, 500+
```

### Valid Reply Classifications (13)
```
INTERESTED, QUALIFIED, MEETING_REQUEST, PRICING, QUESTION,
OBJECTION, NOT_NOW, NOT_INTERESTED, WRONG_PERSON, REFERRAL,
ALREADY_HAVE_PROVIDER, NEEDS_MORE_INFORMATION, UNCLEAR
```

---

## 3. Duplicate Detection

### Company Duplicates
| Check | Method | Action |
|-------|--------|--------|
| Company Name | Case-insensitive exact match | Block + return existing |
| Domain | Extract from Website, compare | Block + return existing |

**Company Name Matching Rules:**
- Strip whitespace before/after
- Case-insensitive comparison
- "Aesthetica Cosmetic Clinic" = "aesthetica cosmetic clinic"
- Does NOT match partial names (e.g. "Aesthetica" ≠ "Aesthetica Cosmetic Clinic")

### Contact Duplicates
| Check | Method | Action |
|-------|--------|--------|
| Email | Exact match (case-insensitive) | Block + return existing |

**Note:** Contact Name is NOT unique — multiple people can have same name.

### Prospect Duplicates
| Check | Method | Action |
|-------|--------|--------|
| Contact ID + Service | Exact match | Block + return existing |

**Note:** Same contact can have multiple prospects if different services.

---

## 4. Relationship Validation

### Foreign Key Checks

| Operation | Check | Error |
|-----------|-------|-------|
| CREATE Contact | Company ID exists in Companies | "Company ID not found" |
| CREATE Prospect | Contact ID exists in Contacts | "Contact ID not found" |
| CREATE Prospect | Company ID exists in Companies | "Company ID not found" |
| CREATE Conversation | Prospect ID exists in Prospects | "Prospect ID not found" |
| CREATE Reply Analysis | Conversation ID exists | "Conversation ID not found" |
| CREATE Reply Analysis | Prospect ID exists | "Prospect ID not found" |
| CREATE Follow-up | Prospect ID exists | "Prospect ID not found" |
| CREATE Meeting | Prospect ID exists | "Prospect ID not found" |
| CREATE Proposal | Prospect ID exists | "Prospect ID not found" |

### Relationship Integrity

| Rule | Check | Error |
|------|-------|-------|
| Contact must belong to a company | Company ID exists | "Company relationship broken" |
| Prospect must belong to contact AND company | Both exist | "Relationship broken" |
| Company on Prospect must match Contact's Company | Prospect.Company ID = Contact's Company ID | "Company mismatch" |

---

## 5. Stage Transition Validation

### Valid Transitions
```
FROM              → ALLOWED TARGETS
───────────────────────────────────────────
NEW               → RESEARCHED, DISQUALIFIED
RESEARCHED        → QUALIFIED, DISQUALIFIED
QUALIFIED         → OUTREACH_READY, DISQUALIFIED
OUTREACH_READY    → CONTACTED, DISQUALIFIED
CONTACTED         → FOLLOW-UP 1, REPLIED, NURTURE, DISQUALIFIED
FOLLOW-UP 1       → FOLLOW-UP 2, REPLIED, NURTURE, DISQUALIFIED
FOLLOW-UP 2       → REPLIED, NURTURE, DISQUALIFIED
REPLIED           → CONVERSATION, QUALIFIED, NURTURE, LOST, DISQUALIFIED
CONVERSATION      → MEETING, PROPOSAL, NURTURE, LOST
MEETING           → PROPOSAL, NURTURE, LOST
PROPOSAL          → NEGOTIATION, WON, LOST, NURTURE
NEGOTIATION       → WON, LOST, NURTURE
WON               → (none — terminal)
LOST              → NURTURE
NURTURE           → RESEARCHED, QUALIFIED, OUTREACH_READY, LOST
DISQUALIFIED      → (none — terminal)
```

### Invalid Transition Error
```
Message: "Cannot move from [CURRENT] to [TARGET]"
Included: List of valid next stages
```

---

## 6. DO_NOT_CONTACT Enforcement

### Absolute Blocks

When Contact Status = "DO_NOT_CONTACT":

| Operation | Result |
|-----------|--------|
| LOG Outreach (Outbound) | ❌ BLOCKED |
| CREATE Follow-up | ❌ BLOCKED |
| MOVE to CONTACTED | ❌ BLOCKED |
| MOVE to FOLLOW-UP 1/2 | ❌ BLOCKED |
| MOVE to OUTREACH_READY | ❌ BLOCKED |
| CREATE Proposal | ⚠️ ALLOWED (internal only) |
| MOVE to NURTURE/LOST | ✅ ALLOWED (internal) |
| READ prospect data | ✅ ALLOWED |
| UPDATE internal fields | ✅ ALLOWED |

### DO_NOT_CONTACT Check Logic
```
1. READ Contact record for prospect
2. IF Contact.Status == "DO_NOT_CONTACT":
   a. IF operation is outbound-related:
      → BLOCK with reason: "Contact is DO_NOT_CONTACT — outreach blocked"
   b. IF operation is internal:
      → ALLOW with note: "Contact is DO_NOT_CONTACT — internal update only"
3. IF Prospect.Stage Modifier == "DO_NOT_CONTACT":
   → Reinforce block
```

---

## 7. Touchpoint Limit Validation

### Limits
```
Email:     4 messages total (1 initial + 3 follow-ups)
LinkedIn:  3 messages total
Combined:  7 messages total across all channels
```

### Check Logic
```
1. READ prospect record
2. GET Email Touchpoints, LinkedIn Touchpoints, Total Touchpoints
3. IF operation is Email:
   → IF Email Touchpoints >= 4: BLOCK ("Email limit reached (4/4)")
4. IF operation is LinkedIn:
   → IF LinkedIn Touchpoints >= 3: BLOCK ("LinkedIn limit reached (3/3)")
5. IF Total Touchpoints >= 7:
   → BLOCK ("Combined limit reached (7/7)")
6. IF not blocked:
   → Proceed with operation
```

### Error Messages
```
"Email touchpoint limit reached (4/4). Move to NURTURE or switch channel."
"LinkedIn touchpoint limit reached (3/3). Move to NURTURE or switch channel."
"Combined touchpoint limit reached (7/7). Move to NURTURE."
```

---

## 8. Date Validation

### Rules
| Check | Error |
|-------|-------|
| Created Date must be valid date | "Invalid date format" |
| Updated Date must be >= Created Date | "Updated Date before Created Date" |
| Scheduled Date must be in future | "Cannot schedule in the past" |
| Meeting Date must be in future | "Cannot schedule meeting in the past" |
| Sent Date must be >= Message Date | "Sent Date before Message Date" |

---

## 9. Audit Log Validation

### Every Mutation Must Log
| Field | Required | Check |
|-------|----------|-------|
| Log ID | ✅ | Auto-generated |
| Timestamp | ✅ | Auto-generated |
| Actor | ✅ | Must be Agent/Riajul/System |
| Action | ✅ | Must be valid action enum |
| Entity Type | ✅ | Must be valid entity |
| Entity ID | ✅ | Must not be blank |
| New Value | ✅ | Must not be blank (for CREATE/UPDATE) |

### Audit Log is Append-Only
- Cannot UPDATE audit log entries
- Cannot DELETE audit log entries
- Cannot reorder audit log entries

---

## 10. Validation Execution Order

For every operation, validations run in this order:

```
1. Entity existence check (does the record exist?)
2. Required field check (are all required fields present?)
3. Enum validation (are values from valid sets?)
4. Duplicate detection (would this create a duplicate?)
5. Foreign key validation (do referenced records exist?)
6. DO_NOT_CONTACT check (is contact blocked?)
7. Touchpoint limit check (are limits exceeded?)
8. Stage transition validation (is this a valid transition?)
9. Date validation (are dates valid and in correct order?)
10. Execute operation
11. Audit log (record the change)
```

If ANY validation fails:
- STOP immediately
- DO NOT execute partial operations
- Return clear error message
- Include which validation failed and why

---

## Validation Error Response Format

```json
{
  "success": false,
  "blocked": true,
  "operation": "CREATE_PROSPECT",
  "validation_failed": "DUPLICATE_DETECTION",
  "reason": "Contact CONT-001 already has prospect for service 'Meta Ads Management'",
  "existing_id": "PRO-003",
  "suggestion": "Update existing prospect PRO-003 instead of creating new one"
}
```
