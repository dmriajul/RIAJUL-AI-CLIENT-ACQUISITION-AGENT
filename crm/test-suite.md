# CRM Validation Test Suite — 12 Scenarios

> Phase 6A — Persistent CRM Implementation
> Tests all critical CRM behaviors with real workflow simulations

---

## Purpose

This test suite validates that the persistent CRM correctly handles 12 real-world scenarios. Each test simulates actual Agent operations and verifies expected outcomes.

**Run these tests after migrating test data to Google Sheets.**

---

## Test Execution

### How to Run Tests

```
Command: Run CRM validation tests
Action: Execute all 12 tests sequentially
Expected: All tests pass
Output: Test report with pass/fail for each test
```

### Test Structure

Each test includes:
- **Scenario** — What we're testing
- **Initial State** — Starting conditions
- **Actions** — What operations to perform
- **Expected Results** — What should happen
- **Validation Checks** — How to verify success
- **Pass Criteria** — Exact conditions for pass

---

## Test 1: Create New Prospect

### Scenario
Create a complete new prospect from scratch (Company → Contact → Prospect)

### Initial State
- CRM is initialized and empty
- No existing records

### Actions
1. CREATE Company: "Test Company A"
2. CREATE Contact: "John Doe" → linked to Company
3. CREATE Prospect: Meta Ads Management, Priority A, linked to Contact

### Expected Results
- Company created with ID COMP-001
- Contact created with ID CONT-001, linked to COMP-001
- Prospect created with ID PRO-001, linked to CONT-001 and COMP-001
- All required fields populated
- Pipeline Stage = NEW
- Audit log has 3 entries (one per CREATE)

### Validation Checks
```sql
-- Check Company
SELECT * FROM Companies WHERE "Company ID" = 'COMP-001'
Expected: 1 row, Company Name = "Test Company A"

-- Check Contact
SELECT * FROM Contacts WHERE "Contact ID" = 'CONT-001'
Expected: 1 row, "Company ID" = 'COMP-001', "Contact Name" = "John Doe"

-- Check Prospect
SELECT * FROM Prospects WHERE "Prospect ID" = 'PRO-001'
Expected: 1 row, "Contact ID" = 'CONT-001', "Company ID" = 'COMP-001',
          "Pipeline Stage" = 'NEW', "Priority" = 'A'

-- Check Audit Log
SELECT * FROM "Audit Log" WHERE "Entity ID" IN ('COMP-001', 'CONT-001', 'PRO-001')
Expected: 3 rows, Action = 'CREATE'
```

### Pass Criteria
- ✅ Company created with correct data
- ✅ Contact created and linked to company
- ✅ Prospect created and linked to contact and company
- ✅ All required fields populated
- ✅ Pipeline Stage = NEW
- ✅ 3 audit log entries created

---

## Test 2: Move Prospect Through Qualification

### Scenario
Move prospect through pipeline stages from NEW to QUALIFIED

### Initial State
- Prospect PRO-001 exists with Pipeline Stage = NEW

### Actions
1. MOVE PRO-001: NEW → RESEARCHED (reason: "Research complete")
2. MOVE PRO-001: RESEARCHED → QUALIFIED (reason: "Priority A assigned")

### Expected Results
- Pipeline Stage progresses: NEW → RESEARCHED → QUALIFIED
- Stage History updated with 3 entries
- Audit log has 2 STAGE_CHANGE entries
- All transitions valid

### Validation Checks
```sql
-- Check current stage
SELECT "Pipeline Stage" FROM Prospects WHERE "Prospect ID" = 'PRO-001'
Expected: 'QUALIFIED'

-- Check stage history
SELECT "Stage History" FROM Prospects WHERE "Prospect ID" = 'PRO-001'
Expected: JSON array with 3 entries (NEW, RESEARCHED, QUALIFIED)

-- Check audit log
SELECT * FROM "Audit Log" WHERE "Entity ID" = 'PRO-001' AND "Action" = 'STAGE_CHANGE'
Expected: 2 rows
```

### Pass Criteria
- ✅ Stage moved correctly (NEW → RESEARCHED → QUALIFIED)
- ✅ Stage History updated
- ✅ Audit log has 2 STAGE_CHANGE entries
- ✅ No invalid transitions

---

## Test 3: Add Second Contact to Same Company

### Scenario
Add multiple contacts to one company

### Initial State
- Company COMP-001 exists with Contact CONT-001

### Actions
1. CREATE Contact: "Jane Smith" → linked to COMP-001
2. CREATE Contact: "Bob Johnson" → linked to COMP-001

### Expected Results
- Company COMP-001 now has 3 contacts
- All contacts linked to same company
- Each contact has unique Contact ID

### Validation Checks
```sql
-- Check all contacts for company
SELECT * FROM Contacts WHERE "Company ID" = 'COMP-001'
Expected: 3 rows (CONT-001, CONT-005, CONT-006)
```

### Pass Criteria
- ✅ 3 contacts linked to COMP-001
- ✅ Each contact has unique ID
- ✅ All linked to same company
- ✅ Audit log has 2 CREATE entries

---

## Test 4: Detect Duplicate Company

### Scenario
Attempt to create duplicate company — should be blocked

### Initial State
- Company "Test Company A" exists as COMP-001

### Actions
1. Attempt CREATE Company: "Test Company A" (exact match)
2. Attempt CREATE Company: "test company a" (case-insensitive)

### Expected Results
- Both attempts blocked
- Error message includes existing Company ID
- No duplicate created

### Validation Checks
```sql
-- Check no duplicate created
SELECT COUNT(*) FROM Companies WHERE "Company Name" = 'Test Company A'
Expected: 1

-- Check audit log for blocks
SELECT * FROM "Audit Log" WHERE "Action" = 'BLOCK' AND "Entity Type" = 'Company'
Expected: 2 rows
```

### Pass Criteria
- ✅ Both attempts blocked
- ✅ Error message includes existing COMP-001
- ✅ No duplicate created
- ✅ Audit log has 2 BLOCK entries

---

## Test 5: Log Outreach

### Scenario
Send initial outreach to prospect

### Initial State
- Prospect PRO-002 exists with Pipeline Stage = QUALIFIED
- Contact CONT-002 has Status = Active

### Actions
1. CREATE Conversation: Outbound, Email, approved by human
2. Prospect stage should move to CONTACTED

### Expected Results
- Conversation created with ID CONV-001
- Message Type = Outbound
- Status = Sent
- Prospect stage moved to CONTACTED
- Touchpoint count incremented
- Audit log updated

### Validation Checks
```sql
-- Check conversation
SELECT * FROM Conversations WHERE "Conversation ID" = 'CONV-001'
Expected: 1 row, "Message Type" = 'Outbound', "Status" = 'Sent'

-- Check prospect stage
SELECT "Pipeline Stage", "Total Touchpoints" FROM Prospects WHERE "Prospect ID" = 'PRO-002'
Expected: Stage = 'CONTACTED', Touchpoints = 1

-- Check audit log
SELECT * FROM "Audit Log" WHERE "Action" = 'SEND'
Expected: 1 row
```

### Pass Criteria
- ✅ Conversation created
- ✅ Prospect stage = CONTACTED
- ✅ Touchpoints = 1
- ✅ Audit log updated

---

## Test 6: Log Positive Reply

### Scenario
Receive and analyze positive reply

### Initial State
- Prospect PRO-002 exists with Pipeline Stage = CONTACTED
- Conversation CONV-001 exists (outbound)

### Actions
1. CREATE Conversation: Inbound, Email (reply received)
2. CREATE Reply Analysis: Classification = INTERESTED, Sentiment = Positive
3. Prospect stage should move to CONVERSATION

### Expected Results
- Inbound conversation created
- Reply analysis created with classification
- Prospect stage moved to CONVERSATION
- Interest Level, Sentiment updated
- Audit log updated

### Validation Checks
```sql
-- Check inbound conversation
SELECT * FROM Conversations WHERE "Message Type" = 'Inbound'
Expected: 1 row

-- Check reply analysis
SELECT * FROM "Reply Analysis" WHERE "Classification" = 'INTERESTED'
Expected: 1 row

-- Check prospect
SELECT "Pipeline Stage", "Interest Level", "Sentiment" FROM Prospects WHERE "Prospect ID" = 'PRO-002'
Expected: Stage = 'CONVERSATION', Interest = 'Medium' or 'High', Sentiment = 'Positive'
```

### Pass Criteria
- ✅ Inbound conversation logged
- ✅ Reply analysis created
- ✅ Prospect stage = CONVERSATION
- ✅ Interest and sentiment updated

---

## Test 7: Create Follow-up

### Scenario
Schedule follow-up after no response

### Initial State
- Prospect PRO-003 exists with Pipeline Stage = CONTACTED
- Last contact was 5 days ago

### Actions
1. CREATE Follow-up: Type = No Response, Scheduled Date = today + 5 days

### Expected Results
- Follow-up created with ID FU-001
- Status = Scheduled
- Prospect Next Follow-up Date updated
- Audit log updated

### Validation Checks
```sql
-- Check follow-up
SELECT * FROM "Follow-ups" WHERE "Follow-up ID" = 'FU-001'
Expected: 1 row, "Status" = 'Scheduled'

-- Check prospect
SELECT "Next Follow-up Date" FROM Prospects WHERE "Prospect ID" = 'PRO-003'
Expected: Date = today + 5 days
```

### Pass Criteria
- ✅ Follow-up created
- ✅ Status = Scheduled
- ✅ Prospect updated with next follow-up date
- ✅ Audit log updated

---

## Test 8: Mark DO_NOT_CONTACT

### Scenario
Mark contact as DO_NOT_CONTACT

### Initial State
- Contact CONT-004 exists with Status = Active

### Actions
1. UPDATE Contact: Status = DO_NOT_CONTACT, Reason = "Requested no contact"

### Expected Results
- Contact Status = DO_NOT_CONTACT
- DO_NOT_CONTACT Date set
- All scheduled follow-ups blocked
- Audit log updated

### Validation Checks
```sql
-- Check contact
SELECT "Status", "DO_NOT_CONTACT Date" FROM Contacts WHERE "Contact ID" = 'CONT-004'
Expected: Status = 'DO_NOT_CONTACT', Date = today

-- Check follow-ups blocked
SELECT COUNT(*) FROM "Follow-ups" WHERE "Status" = 'Blocked' AND "Blocked Reason" LIKE '%DO_NOT_CONTACT%'
Expected: >= 0 (may have follow-ups to block)

-- Check audit log
SELECT * FROM "Audit Log" WHERE "Action" = 'STATUS_CHANGE' AND "New Value" = 'DO_NOT_CONTACT'
Expected: 1 row
```

### Pass Criteria
- ✅ Contact Status = DO_NOT_CONTACT
- ✅ DO_NOT_CONTACT Date set
- ✅ Audit log updated
- ✅ Follow-ups blocked (if any existed)

---

## Test 9: Attempt Prohibited Follow-up After DO_NOT_CONTACT

### Scenario
Attempt to create follow-up for DO_NOT_CONTACT contact — should be blocked

### Initial State
- Contact CONT-004 has Status = DO_NOT_CONTACT
- Prospect PRO-004 linked to CONT-004

### Actions
1. Attempt CREATE Follow-up for PRO-004

### Expected Results
- Operation blocked
- Error message: "Contact is DO_NOT_CONTACT"
- Follow-up created with Status = Blocked
- Audit log shows BLOCK action

### Validation Checks
```sql
-- Check follow-up blocked
SELECT "Status", "Blocked Reason" FROM "Follow-ups" WHERE "Prospect ID" = 'PRO-004'
Expected: Status = 'Blocked', Reason contains 'DO_NOT_CONTACT'

-- Check audit log
SELECT * FROM "Audit Log" WHERE "Action" = 'BLOCK' AND "Entity ID" = 'PRO-004'
Expected: 1 row
```

### Pass Criteria
- ✅ Follow-up blocked
- ✅ Status = Blocked
- ✅ Blocked Reason = DO_NOT_CONTACT
- ✅ Audit log shows BLOCK
- ✅ **CRITICAL: DO_NOT_CONTACT compliance verified**

---

## Test 10: Referral to Another Contact

### Scenario
Process referral from existing prospect

### Initial State
- Prospect PRO-001 exists (source of referral)

### Actions
1. ADD Referral: Source = PRO-001, Referred = "New Company B", "Sarah Connor"

### Expected Results
- New company created (COMP-005)
- New contact created (CONT-007) with Referred By = source contact
- New prospect created (PRO-005) with Stage Modifier = REFERRED
- Source prospect updated with Stage Modifier = REFERRED
- Audit log has 3+ CREATE entries

### Validation Checks
```sql
-- Check new company
SELECT * FROM Companies WHERE "Company ID" = 'COMP-005'
Expected: 1 row

-- Check new contact
SELECT "Referred By" FROM Contacts WHERE "Contact ID" = 'CONT-007'
Expected: Contains source contact name

-- Check new prospect
SELECT "Stage Modifier" FROM Prospects WHERE "Prospect ID" = 'PRO-005'
Expected: 'REFERRED'

-- Check source prospect
SELECT "Stage Modifier" FROM Prospects WHERE "Prospect ID" = 'PRO-001'
Expected: 'REFERRED'
```

### Pass Criteria
- ✅ New company, contact, prospect created
- ✅ Referred By field populated
- ✅ Stage Modifier = REFERRED on both
- ✅ Audit log shows referral chain

---

## Test 11: Re-engage Old Prospect

### Scenario
Re-engage prospect from NURTURE

### Initial State
- Prospect PRO-003 exists with Pipeline Stage = NURTURE

### Actions
1. MOVE PRO-003: NURTURE → RESEARCHED (reason: "Re-engaging with new angle")
2. SET Stage Modifier = RE_ENGAGING
3. MOVE PRO-003: RESEARCHED → OUTREACH_READY
4. CREATE Conversation: Outbound (new outreach)

### Expected Results
- Prospect re-engaged successfully
- Stage Modifier = RE_ENGAGING during process
- New outreach logged
- Touchpoint count reset or continued appropriately

### Validation Checks
```sql
-- Check stage progression
SELECT "Pipeline Stage", "Stage Modifier" FROM Prospects WHERE "Prospect ID" = 'PRO-003'
Expected: Stage = 'CONTACTED', Modifier = null (RE_ENGAGING removed after outreach)

-- Check stage history
SELECT "Stage History" FROM Prospects WHERE "Prospect ID" = 'PRO-003'
Expected: Includes NURTURE → RESEARCHED → OUTREACH_READY → CONTACTED
```

### Pass Criteria
- ✅ Re-engagement successful
- ✅ Stage history shows full progression
- ✅ New outreach logged
- ✅ RE_ENGAGING modifier handled correctly

---

## Test 12: Merge Duplicate Records

### Scenario
Merge duplicate company records

### Initial State
- COMP-001: "Test Company A" (primary)
- COMP-010: "Test Company A" (duplicate, accidentally created)

### Actions
1. MERGE: Primary = COMP-001, Duplicate = COMP-010

### Expected Results
- COMP-001 updated with any missing data from COMP-010
- COMP-010 Status = Duplicate (archived)
- All references to COMP-010 updated to COMP-001
- Audit log has MERGE and ARCHIVE entries

### Validation Checks
```sql
-- Check primary updated
SELECT * FROM Companies WHERE "Company ID" = 'COMP-001'
Expected: Has merged data

-- Check duplicate archived
SELECT "Status" FROM Companies WHERE "Company ID" = 'COMP-010'
Expected: 'Duplicate'

-- Check references updated
SELECT COUNT(*) FROM Contacts WHERE "Company ID" = 'COMP-010'
Expected: 0 (all moved to COMP-001)

-- Check audit log
SELECT * FROM "Audit Log" WHERE "Action" IN ('MERGE', 'ARCHIVE')
Expected: 2 rows
```

### Pass Criteria
- ✅ Primary record updated
- ✅ Duplicate archived (Status = Duplicate)
- ✅ All references updated
- ✅ Audit log shows merge
- ✅ No data lost

---

## Test Report Template

After running all tests:
```
CRM VALIDATION TEST REPORT — [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test 1:  Create New Prospect                    [PASS/FAIL]
Test 2:  Move Through Qualification             [PASS/FAIL]
Test 3:  Add Second Contact                     [PASS/FAIL]
Test 4:  Detect Duplicate Company                [PASS/FAIL]
Test 5:  Log Outreach                           [PASS/FAIL]
Test 6:  Log Positive Reply                     [PASS/FAIL]
Test 7:  Create Follow-up                       [PASS/FAIL]
Test 8:  Mark DO_NOT_CONTACT                    [PASS/FAIL]
Test 9:  Block After DO_NOT_CONTACT             [PASS/FAIL] ⚠️ CRITICAL
Test 10: Referral Processing                    [PASS/FAIL]
Test 11: Re-engage Old Prospect                 [PASS/FAIL]
Test 12: Merge Duplicate Records                [PASS/FAIL]

SUMMARY:
  Passed: [N]/12
  Failed: [N]/12
  Critical Failures: [N] (Test 9 is critical)

FAILED TESTS:
  [List failed tests with details]

NEXT ACTIONS:
  [If all pass: CRM is production-ready]
  [If any fail: Fix issues and re-run]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Critical Test: Test 9

**Test 9 (Block After DO_NOT_CONTACT) is CRITICAL.**

If this test fails:
- **DO NOT proceed to production**
- Fix DO_NOT_CONTACT enforcement immediately
- Re-run test until it passes
- This is a compliance requirement

DO_NOT_CONTACT violations are legal and ethical failures. This test must pass.

---

## Running Tests

### Automated (Future)
Once CRM is connected, create automated test script:
```
Command: Run CRM validation tests
Action: Execute all 12 tests
Output: Test report
```

### Manual (Current)
Until automation is built, run tests manually:
1. Execute each test scenario
2. Manually verify expected results
3. Document pass/fail
4. Generate test report

---

## Success Criteria

**All 12 tests must pass for CRM to be production-ready.**

If any test fails:
1. Identify root cause
2. Fix issue in CRM implementation
3. Re-run failed test
4. Continue until all pass

**Test 9 is critical and must pass before any real prospect tracking begins.**
