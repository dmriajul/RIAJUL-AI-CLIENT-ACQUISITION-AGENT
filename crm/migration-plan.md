# CRM Migration Plan — Test Data Population

> Phase 6A — Persistent CRM Implementation
> Migrates verified test prospects from project files to persistent CRM

---

## Purpose

This document defines how to migrate existing test prospects from the project files into the persistent CRM structure. Only verified data will be migrated — no fabricated information.

---

## Migration Strategy

### Phase 1: Create Empty CRM Structure
1. Create Google Sheets with 10 sheets
2. Set up column headers for each sheet
3. Configure data validation rules
4. Test basic read/write operations

### Phase 2: Migrate Test Data
1. Migrate companies (verified prospects from audits/)
2. Migrate contacts for each company
3. Migrate prospects with research data
4. Verify all relationships are correct
5. Generate audit log entries for all migrations

### Phase 3: Validate Migration
1. Check all required fields populated
2. Verify no duplicates created
3. Confirm relationships intact
4. Run test suite (12 scenarios)
5. Generate migration report

---

## Source Data

### Verified Test Prospects (from audits/5-prospect-validation-test.md)

**1. Aesthetica Cosmetic Clinic (A-Priority)**
```
Company:
  Name: Aesthetica Cosmetic Clinic
  Website: https://glow.com.au/clinics/melbourne/aesthetica-cosmetic-clinic
  Industry: Aesthetic / Cosmetic
  Country: Australia
  City: Melbourne (South Yarra)
  Company Size: 1-10
  Phone: (03) 7031 7111
  Google Reviews: 28 reviews at 4.9 rating

Contact:
  Name: Dr. David Ong
  Role: Medical Director
  Decision Maker Status: Decision-maker
  Notes: Owner and medical director

Prospect:
  Service: Local SEO & ORM
  Priority: A
  Priority Reason: 28 reviews at 4.9 rating — low review count despite excellent rating, clear ORM opportunity
  ICP Segment: Tertiary
  Opportunity: Low review count (28) despite high rating (4.9) — ORM opportunity to increase review volume
  Research Evidence: 28 Google reviews, 4.9 rating, South Yarra VIC, doctor-led clinic
  Portfolio Proof: AU Medical Clinic case study (+74 reviews, +148% calls, Maps #1-3)
  Pipeline Stage: QUALIFIED
```

**2. Beefcake Swimwear (A-Priority)**
```
Company:
  Name: Beefcake Swimwear
  Website: https://www.beefcakeswimwear.com
  Industry: Fashion / Swimwear
  Country: USA
  Company Size: 1-10
  Instagram: @beefcakeswimwear

Contact:
  Name: Mel Brittner Wells
  Role: Founder
  Decision Maker Status: Decision-maker
  Notes: Founder, gender-neutral sustainable swimwear

Prospect:
  Service: Meta Ads Management
  Priority: A
  Priority Reason: Female-founded, sustainable fashion, multiple products sold out — strong Meta Ads opportunity
  ICP Segment: Secondary
  Opportunity: Multiple products sold out — Meta Ads could drive consistent traffic and reduce dependency on organic
  Research Evidence: Gender-neutral swimwear, XS-5X sizing, LGBTQ+ owned, 100% recycled polyester, $109/swimsuit, featured in Forbes/Teen Vogue/Cosmopolitan
  Portfolio Proof: Spreka case study (214K reach, €1.40 CPM), Salient Shop (344 sales in 7 days)
  Pipeline Stage: QUALIFIED
```

**3. City Aesthetic Australia (B-Priority)**
```
Company:
  Name: City Aesthetic Australia
  Website: https://reviews.birdeye.com/city-aesthetic-australia
  Industry: Aesthetic / Cosmetic
  Country: Australia
  City: Sydney
  Address: Level 7/428 George St, Sydney NSW
  Phone: 0478 112 990
  Google Reviews: 47 reviews at 4.5 rating

Contact:
  Name: Not verified
  Role: Not verified
  Decision Maker Status: Unknown

Prospect:
  Service: Meta Ads Management
  Priority: B
  Priority Reason: 47 reviews at 4.5 rating — established clinic, potential for Meta Ads to drive bookings
  ICP Segment: Tertiary
  Opportunity: Established clinic with good review volume — Meta Ads could increase booking rate
  Research Evidence: 47 Google reviews, 4.5 rating, Sydney CBD location, services: fillers, injectables, NCTF
  Portfolio Proof: AU Medical Clinic case study (relevant industry)
  Pipeline Stage: QUALIFIED
  Notes: Contact name not verified — need to research decision-maker
```

**4. Clothing Connection (Disqualified)**
```
Company:
  Name: Clothing Connection
  Website: https://www.clothingconnectiononline.com
  Industry: Menswear / Retail
  Country: USA
  City: Aurora, CO
  Company Size: 11-50 (family-run)

Contact:
  Name: Not verified
  Role: Not verified
  Decision Maker Status: Unknown

Prospect:
  Service: Meta Ads Management
  Priority: C
  Priority Reason: DISQUALIFIED — already has proven agency support (Inflow case study shows 219% social ad revenue increase, 5.7x ROAS)
  ICP Segment: Secondary
  Opportunity: None — already has effective agency
  Research Evidence: Inflow case study shows 219% social ad revenue increase, 5.7x ROAS
  Portfolio Proof: N/A
  Pipeline Stage: DISQUALIFIED
  Notes: Already has proven agency support — no gap identified
```

---

## Migration Steps

### Step 1: Create Companies

**For each verified company:**
1. CREATE Company record
2. Populate all known fields
3. Mark unverified fields as "Not verified"
4. Log audit event

**Expected Output:**
```
COMP-001: Aesthetica Cosmetic Clinic
COMP-002: Beefcake Swimwear
COMP-003: City Aesthetic Australia
COMP-004: Clothing Connection
```

### Step 2: Create Contacts

**For each verified contact:**
1. CREATE Contact record
2. Link to Company ID
3. Populate all known fields
4. Mark unverified fields as "Not verified"
5. Log audit event

**Expected Output:**
```
CONT-001: Dr. David Ong → COMP-001
CONT-002: Mel Brittner Wells → COMP-002
CONT-003: Not verified → COMP-003
CONT-004: Not verified → COMP-004
```

### Step 3: Create Prospects

**For each verified prospect:**
1. CREATE Prospect record
2. Link to Contact ID and Company ID
3. Populate all required fields from research
4. Set Pipeline Stage based on current status
5. Initialize Stage History
6. Log audit event

**Expected Output:**
```
PRO-001: CONT-001 → COMP-001, Local SEO & ORM, Priority A, Stage: QUALIFIED
PRO-002: CONT-002 → COMP-002, Meta Ads Management, Priority A, Stage: QUALIFIED
PRO-003: CONT-003 → COMP-003, Meta Ads Management, Priority B, Stage: QUALIFIED
PRO-004: CONT-004 → COMP-004, Meta Ads Management, Priority C, Stage: DISQUALIFIED
```

### Step 4: Generate Audit Log

**For each migration action:**
1. Log Company creation
2. Log Contact creation
3. Log Prospect creation
4. Mark all as Actor: "Agent", Reason: "Migration from test data"

**Expected Output:**
```
LOG-001 to LOG-012: Migration audit trail
```

### Step 5: Initialize Metrics

**Create first Metrics entry:**
```
Metric Date: 2026-09-17
Prospects Researched: 4
Prospects Qualified: 3
Notes: Initial migration of test prospects
```

---

## Migration Validation

### After Migration, Verify:

**Companies (4 records):**
- [ ] COMP-001: Aesthetica Cosmetic Clinic — all fields populated
- [ ] COMP-002: Beefcake Swimwear — all fields populated
- [ ] COMP-003: City Aesthetic Australia — unverified fields marked
- [ ] COMP-004: Clothing Connection — all fields populated

**Contacts (4 records):**
- [ ] CONT-001: Dr. David Ong → COMP-001
- [ ] CONT-002: Mel Brittner Wells → COMP-002
- [ ] CONT-003: Not verified → COMP-003
- [ ] CONT-004: Not verified → COMP-004

**Prospects (4 records):**
- [ ] PRO-001: Local SEO & ORM, Priority A, Stage QUALIFIED
- [ ] PRO-002: Meta Ads Management, Priority A, Stage QUALIFIED
- [ ] PRO-003: Meta Ads Management, Priority B, Stage QUALIFIED
- [ ] PRO-004: Meta Ads Management, Priority C, Stage DISQUALIFIED

**Relationships:**
- [ ] All Contacts linked to Companies
- [ ] All Prospects linked to Contacts and Companies
- [ ] No orphaned records

**Audit Log:**
- [ ] All CREATE operations logged
- [ ] Timestamps correct
- [ ] Actor = "Agent"
- [ ] Reason = "Migration from test data"

**Metrics:**
- [ ] First Metrics entry created
- [ ] Counts match migrated data

---

## Data Quality Rules

### What to Migrate
✅ Verified data from audits/ files
✅ Data from portfolio.riajultech.com
✅ Data from 5-prospect-validation-test.md

### What NOT to Migrate
❌ Fabricated contact names
❌ Unverified email addresses
❌ Assumed phone numbers
❌ Guessed company details

### Marking Unverified Data
When a field is not verified:
- Set value to: "Not verified"
- Do NOT leave blank (blank = unknown vs. "Not verified" = known to be unverified)
- Add note explaining what's missing

**Example:**
```
Contact Name: Not verified
Notes: Need to research decision-maker name from website or LinkedIn
```

---

## Migration Report Template

After migration, generate report:
```
MIGRATION REPORT — [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━

COMPANIES:
  Created: 4
  Duplicates detected: 0
  Failed: 0

CONTACTS:
  Created: 4
  Verified: 2 (Dr. David Ong, Mel Brittner Wells)
  Unverified: 2 (City Aesthetic, Clothing Connection)
  Duplicates detected: 0
  Failed: 0

PROSPECTS:
  Created: 4
  Priority A: 2
  Priority B: 1
  Priority C: 1 (disqualified)
  Pipeline Stages:
    QUALIFIED: 3
    DISQUALIFIED: 1
  Failed: 0

RELATIONSHIPS:
  Company → Contact: 4 links verified
  Contact → Prospect: 4 links verified
  Orphaned records: 0

AUDIT LOG:
  Entries created: 12
  All operations logged: ✅

METRICS:
  First entry created: ✅
  Date: 2026-09-17

DATA QUALITY:
  Verified fields: 85%
  Unverified fields marked: ✅
  Fabricated data: 0

STATUS: ✅ Migration complete
━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Post-Migration Actions

After successful migration:
1. Run CRM validation tests (12 scenarios)
2. Verify all tests pass
3. Begin using CRM for real prospect tracking
4. Monitor for any data issues
5. Generate daily metrics going forward

---

## Rollback Plan

If migration fails:
1. Delete all migrated records
2. Clear audit log entries
3. Fix issues
4. Re-run migration
5. Verify again

**Note:** Since CRM is new, rollback is simple — just delete and recreate.

---

## Timeline

**Estimated Migration Time:** 30 minutes
- Step 1: Create structure — 5 minutes
- Step 2: Migrate companies — 5 minutes
- Step 3: Migrate contacts — 5 minutes
- Step 4: Migrate prospects — 10 minutes
- Step 5: Generate audit log — 2 minutes
- Step 6: Validate — 3 minutes

---

## Success Criteria

Migration is successful when:
- ✅ All 4 companies created
- ✅ All 4 contacts created and linked
- ✅ All 4 prospects created and linked
- ✅ All required fields populated
- ✅ Unverified fields marked as "Not verified"
- ✅ All audit log entries created
- ✅ No duplicates created
- ✅ No orphaned records
- ✅ Metrics initialized
- ✅ Validation tests pass (12/12)
