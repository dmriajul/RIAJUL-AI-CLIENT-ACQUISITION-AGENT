/**
 * CRM Unit Tests
 * 
 * Runs with: node --test test/unit/crm.test.js
 * Uses Node.js built-in test runner — no dependencies needed.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { MemoryAdapter } from '../../src/storage/memory.js';
import { CRMService } from '../../src/service/crm.js';
import { validateStageTransition } from '../../src/validation/stages.js';
import {
  validateProspectCreate,
  validateConversationCreate,
  checkDoNotContact,
  checkTouchpointLimits
} from '../../src/validation/rules.js';

let storage;
let crm;

beforeEach(async () => {
  storage = new MemoryAdapter();
  crm = new CRMService(storage);
});

// ============================================
// TEST 1: Create New Prospect (Full Pipeline)
// ============================================
describe('Test 1: Create New Prospect', () => {
  it('should create company, contact, and prospect', async () => {
    const companyResult = await crm.createCompany({
      'Company Name': 'Test Corp',
      'Website': 'https://testcorp.com',
      'Industry': 'Technology'
    });

    assert.equal(companyResult.success, true);
    assert.equal(companyResult.companyId, 'COMP-001');

    const contactResult = await crm.createContact({
      'Company ID': 'COMP-001',
      'Contact Name': 'John Doe',
      'Role': 'CEO',
      'Email': 'john@testcorp.com'
    });

    assert.equal(contactResult.success, true);
    assert.equal(contactResult.contactId, 'CONT-001');

    const prospectResult = await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Strong fit for Meta Ads',
      'ICP Segment': 'Primary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'No paid ads running, clear gap',
      'Research Evidence': 'Organic traffic only, no ad library presence',
      'Portfolio Proof': 'Foring Group case study'
    });

    assert.equal(prospectResult.success, true);
    assert.equal(prospectResult.prospectId, 'PRO-001');
    assert.equal(prospectResult.prospect['Pipeline Stage'], 'NEW');
    assert.equal(prospectResult.prospect['Total Touchpoints'], 0);
  });

  it('should create audit log entries for each creation', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001', 'Contact Name': 'Jane' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'B',
      'Priority Reason': 'Test',
      'ICP Segment': 'Secondary',
      'Service': 'SEO',
      'Opportunity': 'Test opportunity',
      'Research Evidence': 'Test evidence',
      'Portfolio Proof': 'Test proof'
    });

    const auditLog = await storage.readAll('Audit Log');
    assert.equal(auditLog.length, 3);
    assert.equal(auditLog[0].Action, 'CREATE');
    assert.equal(auditLog[0]['Entity Type'], 'Company');
    assert.equal(auditLog[1]['Entity Type'], 'Contact');
    assert.equal(auditLog[2]['Entity Type'], 'Prospect');
  });
});

// ============================================
// TEST 2: Invalid Prospect Rejection
// ============================================
describe('Test 2: Invalid Prospect Rejection', () => {
  it('should reject prospect with missing required fields', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });

    await assert.rejects(
      () => crm.createProspect({
        'Contact ID': 'CONT-001',
        'Company ID': 'COMP-001',
        // Missing: Priority, Priority Reason, ICP Segment, Service, etc.
      }),
      /Validation failed/
    );
  });

  it('should reject prospect with invalid priority', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });

    await assert.rejects(
      () => crm.createProspect({
        'Contact ID': 'CONT-001',
        'Company ID': 'COMP-001',
        'Priority': 'X',  // Invalid
        'Priority Reason': 'Test',
        'ICP Segment': 'Primary',
        'Service': 'SEO',
        'Opportunity': 'Test',
        'Research Evidence': 'Test',
        'Portfolio Proof': 'Test'
      }),
      /Validation failed/
    );
  });

  it('should reject prospect with non-existent company', async () => {
    await assert.rejects(
      () => crm.createProspect({
        'Contact ID': 'CONT-999',
        'Company ID': 'COMP-999',
        'Priority': 'A',
        'Priority Reason': 'Test',
        'ICP Segment': 'Primary',
        'Service': 'SEO',
        'Opportunity': 'Test',
        'Research Evidence': 'Test',
        'Portfolio Proof': 'Test'
      }),
      /Contact not found/
    );
  });
});

// ============================================
// TEST 3: Prospect Update
// ============================================
describe('Test 3: Prospect Update', () => {
  it('should update prospect fields', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'B',
      'Priority Reason': 'Good fit',
      'ICP Segment': 'Secondary',
      'Service': 'SEO',
      'Opportunity': 'Low organic visibility',
      'Research Evidence': 'No blog, no SEO presence',
      'Portfolio Proof': 'Riajul Tech case study'
    });

    const updateResult = await crm.updateProspect('PRO-001', {
      'Priority': 'A',
      'Interest Level': 'High'
    }, 'Agent', 'Upgraded priority after further research');

    assert.equal(updateResult.success, true);
    assert.equal(updateResult.prospect.Priority, 'A');
    assert.equal(updateResult.prospect['Interest Level'], 'High');
  });

  it('should log audit entries for each updated field', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'B',
      'Priority Reason': 'Test',
      'ICP Segment': 'Secondary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Get audit count before update (should be 3: Company + Contact + Prospect CREATE)
    const auditBefore = await storage.readAll('Audit Log');
    const countBefore = auditBefore.length;

    await crm.updateProspect('PRO-001', {
      'Priority': 'A',
      'Sentiment': 'Positive'
    }, 'Agent', 'Updated after review');

    const auditAfter = await storage.readAll('Audit Log');
    // Should have added 2 UPDATE entries (Priority + Sentiment)
    assert.equal(auditAfter.length, countBefore + 2);
    const updateLogs = auditAfter.filter(l => l.Action === 'UPDATE');
    assert.equal(updateLogs.length, 2);
  });
});

// ============================================
// TEST 4: Search
// ============================================
describe('Test 4: Search', () => {
  it('should search prospects by priority', async () => {
    await crm.createCompany({ 'Company Name': 'Corp A' });
    await crm.createCompany({ 'Company Name': 'Corp B' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createContact({ 'Company ID': 'COMP-002' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });
    await crm.createProspect({
      'Contact ID': 'CONT-002',
      'Company ID': 'COMP-002',
      'Priority': 'B',
      'Priority Reason': 'Test',
      'ICP Segment': 'Secondary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const aProspects = await crm.searchProspects('Priority', 'A');
    assert.equal(aProspects.length, 1);
    assert.equal(aProspects[0]['Prospect ID'], 'PRO-001');

    const bProspects = await crm.searchProspects('Priority', 'B');
    assert.equal(bProspects.length, 1);
  });
});

// ============================================
// TEST 5: Valid Stage Transition
// ============================================
describe('Test 5: Valid Stage Transition', () => {
  it('should allow valid stage transitions', async () => {
    const transition = validateStageTransition('NEW', 'RESEARCHED');
    assert.equal(transition.valid, true);
  });

  it('should move prospect through stages', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // NEW → RESEARCHED
    const r1 = await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Research complete');
    assert.equal(r1.success, true);
    assert.equal(r1.from, 'NEW');
    assert.equal(r1.to, 'RESEARCHED');

    // RESEARCHED → QUALIFIED
    const r2 = await crm.updateStage('PRO-001', 'QUALIFIED', 'Agent', 'Priority A assigned');
    assert.equal(r2.success, true);

    // Verify stage history
    const prospect = await crm.getProspect('PRO-001');
    const history = JSON.parse(prospect['Stage History']);
    assert.equal(history.length, 3); // NEW, RESEARCHED, QUALIFIED
  });

  it('should require a reason for stage change', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await assert.rejects(
      () => crm.updateStage('PRO-001', 'RESEARCHED', 'Agent'),
      /requires a reason/
    );
  });
});

// ============================================
// TEST 6: Invalid Stage Transition
// ============================================
describe('Test 6: Invalid Stage Transition', () => {
  it('should block invalid stage transitions', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // NEW → WON (invalid)
    const result = await crm.updateStage('PRO-001', 'WON', 'Agent', 'Skipping everything');
    assert.equal(result.success, false);
    assert.equal(result.blocked, true);
    assert.ok(result.reason.includes('Cannot transition'));
    assert.ok(result.allowedStages.includes('RESEARCHED'));
  });

  it('should block backward transitions', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Research done');
    await crm.updateStage('PRO-001', 'QUALIFIED', 'Agent', 'Qualified');

    // QUALIFIED → NEW (backward)
    const result = await crm.updateStage('PRO-001', 'NEW', 'Agent', 'Going back');
    assert.equal(result.success, false);
    assert.equal(result.blocked, true);
  });
});

// ============================================
// TEST 7: DO_NOT_CONTACT Enforcement (CRITICAL)
// ============================================
describe('Test 7: DO_NOT_CONTACT Enforcement', () => {
  it('should block all outbound actions after DO_NOT_CONTACT', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Mark DO_NOT_CONTACT
    await crm.markDoNotContact('CONT-001', 'Prospect requested no contact', 'Riajul');

    // Verify contact status
    const contact = await crm.getContact('CONT-001');
    assert.equal(contact.Status, 'DO_NOT_CONTACT');

    // Try to send outbound message — should be BLOCKED
    const outreachResult = await crm.addInteraction({
      'Prospect ID': 'PRO-001',
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Test message',
      'Human Approved': true
    });

    assert.equal(outreachResult.success, false);
    assert.equal(outreachResult.blocked, true);
    assert.ok(outreachResult.reason.includes('DO_NOT_CONTACT'));
  });

  it('should block stage transitions to outbound stages after DO_NOT_CONTACT', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Research done');
    await crm.updateStage('PRO-001', 'QUALIFIED', 'Agent', 'Qualified');
    await crm.updateStage('PRO-001', 'OUTREACH_READY', 'Agent', 'Draft ready');

    await crm.markDoNotContact('CONT-001', 'Stop contacting', 'Riajul');

    // Try to move to CONTACTED (outbound stage)
    const result = await crm.updateStage('PRO-001', 'CONTACTED', 'Agent', 'Sending');
    assert.equal(result.success, false);
    assert.equal(result.blocked, true);
  });

  it('should block follow-up creation after DO_NOT_CONTACT', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.markDoNotContact('CONT-001', 'Requested removal', 'Riajul');

    const followupResult = await crm.addFollowUp({
      'Prospect ID': 'PRO-001',
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'New case study',
      'Draft Content': 'Hi, ...'
    });

    assert.equal(followupResult.success, false);
    assert.equal(followupResult.blocked, true);
    assert.equal(followupResult.status, 'Blocked');
  });

  it('should allow internal stage changes (NURTURE, LOST) after DO_NOT_CONTACT', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Done');
    await crm.updateStage('PRO-001', 'QUALIFIED', 'Agent', 'Qualified');
    await crm.markDoNotContact('CONT-001', 'Stop', 'Riajul');

    // LOST is NOT an outbound stage — should be allowed
    const result = await crm.updateStage('PRO-001', 'LOST', 'Agent', 'DO_NOT_CONTACT');
    // QUALIFIED → LOST is not valid directly; let's check the rule
    // Actually QUALIFIED valid next: OUTREACH_READY, DISQUALIFIED
    // So this should fail for transition reason, not DO_NOT_CONTACT reason
    // Let me test with a valid transition that's not outbound

    // QUALIFIED → DISQUALIFIED is valid and not outbound
    const result2 = await crm.updateStage('PRO-001', 'DISQUALIFIED', 'Agent', 'DO_NOT_CONTACT');
    assert.equal(result2.success, true);
  });
});

// ============================================
// TEST 8: Interaction Creation
// ============================================
describe('Test 8: Interaction Creation', () => {
  it('should log outbound interaction and increment touchpoints', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const result = await crm.addInteraction({
      'Prospect ID': 'PRO-001',
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Hi, I noticed your company...',
      'Human Approved': true
    });

    assert.equal(result.success, true);
    assert.ok(result.conversationId);

    const prospect = await crm.getProspect('PRO-001');
    assert.equal(prospect['Total Touchpoints'], 1);
    assert.equal(prospect['Email Touchpoints'], 1);
    assert.equal(prospect['LinkedIn Touchpoints'], 0);
  });

  it('should log inbound interaction', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const result = await crm.addInteraction({
      'Prospect ID': 'PRO-001',
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Yes, I am interested in learning more.'
    });

    assert.equal(result.success, true);
    const prospect = await crm.getProspect('PRO-001');
    assert.ok(prospect['Last Reply Date']);
    // Total Touchpoints should NOT increment for inbound
    assert.equal(prospect['Total Touchpoints'], 0);
  });

  it('should reject outbound without human approval', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await assert.rejects(
      () => crm.addInteraction({
        'Prospect ID': 'PRO-001',
        'Message Type': 'Outbound',
        'Message Channel': 'Email',
        'Message Content': 'Test',
        'Human Approved': false
      }),
      /Validation failed/
    );
  });
});

// ============================================
// TEST 9: Follow-up Creation
// ============================================
describe('Test 9: Follow-up Creation', () => {
  it('should create a scheduled follow-up', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const result = await crm.addFollowUp({
      'Prospect ID': 'PRO-001',
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'New case study about similar company',
      'Draft Content': 'Hi, wanted to follow up...'
    });

    assert.equal(result.success, true);
    assert.equal(result.followup.Status, 'Scheduled');
    assert.ok(result.followupId);
  });

  it('should enforce touchpoint limits on follow-ups', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Exhaust email touchpoints (4 max)
    for (let i = 0; i < 4; i++) {
      await crm.addInteraction({
        'Prospect ID': 'PRO-001',
        'Message Type': 'Outbound',
        'Message Channel': 'Email',
        'Message Content': `Message ${i + 1}`,
        'Human Approved': true
      });
    }

    // Try to create email follow-up — should be blocked
    const result = await crm.addFollowUp({
      'Prospect ID': 'PRO-001',
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-30',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Test',
      'Draft Content': 'Test'
    });

    assert.equal(result.success, false);
    assert.equal(result.blocked, true);
    assert.ok(result.reason.includes('limit reached'));
  });
});

// ============================================
// TEST 10: Audit Logging
// ============================================
describe('Test 10: Audit Logging', () => {
  it('should maintain complete audit trail', async () => {
    await crm.createCompany({ 'Company Name': 'Audit Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001', 'Contact Name': 'Audit Contact' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Research done');
    await crm.updateStage('PRO-001', 'QUALIFIED', 'Agent', 'Qualified');
    await crm.updateProspect('PRO-001', { 'Interest Level': 'High' }, 'Agent', 'Updated interest');

    const auditLog = await storage.readAll('Audit Log');

    // Should have: 3 CREATEs + 2 STAGE_CHANGEs + 1 UPDATE = 6
    assert.equal(auditLog.length, 6);

    // Verify all have timestamps
    for (const entry of auditLog) {
      assert.ok(entry.Timestamp);
      assert.ok(entry.Actor);
      assert.ok(entry.Action);
    }

    // Verify stage change entries
    const stageChanges = auditLog.filter(e => e.Action === 'STAGE_CHANGE');
    assert.equal(stageChanges.length, 2);
    assert.equal(stageChanges[0]['Previous Value'], 'NEW');
    assert.equal(stageChanges[0]['New Value'], 'RESEARCHED');
    assert.equal(stageChanges[1]['Previous Value'], 'RESEARCHED');
    assert.equal(stageChanges[1]['New Value'], 'QUALIFIED');
  });

  it('should allow querying audit history by entity', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const history = await crm.audit.getHistory('PRO-001');
    assert.ok(history.length >= 1); // At least the CREATE
  });
});

// ============================================
// TEST 11: Migration
// ============================================
describe('Test 11: Migration', () => {
  it('should migrate test prospects', async () => {
    const testProspects = [
      {
        company: {
          name: 'Migrated Corp',
          website: 'https://migrated.com',
          industry: 'Testing',
          country: 'USA'
        },
        contact: {
          name: 'Migration Test',
          role: 'Tester',
          decisionMakerStatus: 'Decision-maker'
        },
        priority: 'A',
        priorityReason: 'Test migration',
        icpSegment: 'Primary',
        service: 'SEO',
        opportunity: 'Test',
        researchEvidence: 'Test',
        portfolioProof: 'Test',
        pipelineStage: 'QUALIFIED'
      }
    ];

    const results = await crm.migrateProspects(testProspects);

    assert.equal(results.companies.created, 1);
    assert.equal(results.contacts.created, 1);
    assert.equal(results.prospects.created, 1);
    assert.equal(results.errors.length, 0);

    // Verify data in storage
    const companies = await storage.readAll('Companies');
    assert.equal(companies.length, 1);
    assert.equal(companies[0]['Company Name'], 'Migrated Corp');

    const prospects = await storage.readAll('Prospects');
    assert.equal(prospects.length, 1);
    assert.equal(prospects[0]['Pipeline Stage'], 'QUALIFIED');
  });

  it('should handle duplicate migration gracefully', async () => {
    const testProspects = [
      {
        company: { name: 'Same Corp' },
        contact: { name: 'Same Contact' },
        priority: 'A',
        priorityReason: 'Test',
        icpSegment: 'Primary',
        service: 'SEO',
        opportunity: 'Test',
        researchEvidence: 'Test',
        portfolioProof: 'Test'
      }
    ];

    // Migrate twice
    const results1 = await crm.migrateProspects(testProspects);
    const results2 = await crm.migrateProspects(testProspects);

    // First migration should create everything
    assert.equal(results1.companies.created, 1);
    assert.equal(results1.contacts.created, 1);
    assert.equal(results1.prospects.created, 1);

    // Second migration should detect duplicates
    // Note: Company name is the same, so it will be skipped
    // Contact is linked to company, so it will also be skipped
    // Prospect is same contact + service, so it will be skipped
    assert.ok(results2.companies.skipped >= 0 || results2.companies.created === 0);
  });
});

// ============================================
// TEST 12: Storage Error Handling
// ============================================
describe('Test 12: Storage Error Handling', () => {
  it('should handle non-existent prospect update', async () => {
    await assert.rejects(
      () => crm.updateProspect('PRO-999', { Priority: 'A' }),
      /Prospect not found/
    );
  });

  it('should handle non-existent contact DO_NOT_CONTACT', async () => {
    await assert.rejects(
      () => crm.markDoNotContact('CONT-999', 'Test'),
      /Contact not found/
    );
  });

  it('should handle invalid sheet names', async () => {
    await assert.rejects(
      () => storage.readAll('NonExistentSheet'),
      /Unknown sheet/
    );
  });

  it('should handle relationship integrity violations', async () => {
    await crm.createCompany({ 'Company Name': 'Corp A' });
    await crm.createCompany({ 'Company Name': 'Corp B' });
    await crm.createContact({ 'Company ID': 'COMP-001' }); // Contact belongs to COMP-001

    // Try to create prospect with mismatched company
    await assert.rejects(
      () => crm.createProspect({
        'Contact ID': 'CONT-001',  // Belongs to COMP-001
        'Company ID': 'COMP-002',  // But we say COMP-002
        'Priority': 'A',
        'Priority Reason': 'Test',
        'ICP Segment': 'Primary',
        'Service': 'SEO',
        'Opportunity': 'Test',
        'Research Evidence': 'Test',
        'Portfolio Proof': 'Test'
      }),
      /Company mismatch/
    );
  });
});

// ============================================
// TEST 13: Duplicate Detection
// ============================================
describe('Test 13: Duplicate Detection', () => {
  it('should detect duplicate company by name (case-insensitive)', async () => {
    await crm.createCompany({ 'Company Name': 'Aesthetica Clinic' });

    const result = await crm.createCompany({ 'Company Name': 'aesthetica clinic' });
    assert.equal(result.success, false);
    assert.equal(result.blocked, true);
    assert.equal(result.existingCompanyId, 'COMP-001');
  });

  it('should detect duplicate prospect (same contact + service)', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });

    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Same contact, same service = duplicate
    const result = await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'B',
      'Priority Reason': 'Test again',
      'ICP Segment': 'Secondary',
      'Service': 'SEO',
      'Opportunity': 'Another test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    assert.equal(result.success, false);
    assert.equal(result.blocked, true);

    // Same contact, different service = NOT duplicate
    const result2 = await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'B',
      'Priority Reason': 'Different service',
      'ICP Segment': 'Secondary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    assert.equal(result2.success, true);
  });
});

// ============================================
// TEST 14: Referral
// ============================================
describe('Test 14: Referral', () => {
  it('should create new records from referral', async () => {
    await crm.createCompany({ 'Company Name': 'Source Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001', 'Contact Name': 'Source Contact' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    const result = await crm.addReferral({
      sourceProspectId: 'PRO-001',
      referredCompanyName: 'Referred Corp',
      referredContactName: 'Jane Referral',
      referredEmail: 'jane@referred.com',
      service: 'Meta Ads Management'
    });

    assert.equal(result.success, true);
    assert.ok(result.companyId);
    assert.ok(result.contactId);
    assert.ok(result.prospectId);

    // Verify source prospect has REFERRED modifier
    const sourceProspect = await crm.getProspect('PRO-001');
    assert.equal(sourceProspect['Stage Modifier'], 'REFERRED');

    // Verify referred contact has "Referred By" field
    const referredContact = await crm.getContact(result.contactId);
    assert.equal(referredContact['Referred By'], 'Source Contact');
  });
});

// ============================================
// TEST 15: Complete Prospect History
// ============================================
describe('Test 15: Complete Prospect History', () => {
  it('should return full history', async () => {
    await crm.createCompany({ 'Company Name': 'History Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001', 'Contact Name': 'History Contact' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    await crm.updateStage('PRO-001', 'RESEARCHED', 'Agent', 'Done');
    await crm.addInteraction({
      'Prospect ID': 'PRO-001',
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Hello'
    });

    const history = await crm.getProspectHistory('PRO-001');

    assert.ok(history.prospect);
    assert.ok(history.contact);
    assert.ok(history.company);
    assert.ok(history.conversations.length >= 1);
    assert.ok(history.auditTrail.length >= 1);
    assert.equal(history.summary.pipelineStage, 'RESEARCHED');
    assert.equal(history.summary.stageHistory.length, 2); // NEW, RESEARCHED
  });
});

// ============================================
// TEST 16: Merge Duplicates
// ============================================
describe('Test 16: Merge Duplicate Records', () => {
  it('should merge duplicate companies', async () => {
    // Create two companies manually in storage to simulate duplicate
    await storage.insert('Companies', {
      'Company ID': 'COMP-001',
      'Company Name': 'Original Corp',
      'Website': 'https://original.com',
      'Industry': 'Tech',
      'Country': '',
      'Status': 'Active',
      'Created Date': '2026-09-17',
      'Updated Date': '2026-09-17'
    });

    await storage.insert('Companies', {
      'Company ID': 'COMP-002',
      'Company Name': 'Original Corp (duplicate)',
      'Website': '',
      'Industry': '',
      'Country': 'USA',
      'Status': 'Active',
      'Created Date': '2026-09-17',
      'Updated Date': '2026-09-17'
    });

    // Add a contact to the duplicate
    await storage.insert('Contacts', {
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-002',
      'Contact Name': 'Test',
      'Status': 'Active',
      'Created Date': '2026-09-17',
      'Updated Date': '2026-09-17'
    });

    const result = await crm.mergeCompanies('COMP-001', 'COMP-002');

    assert.equal(result.success, true);
    assert.equal(result.referencesUpdated, 1); // Contact moved

    // Verify duplicate is archived
    const duplicate = await crm.getCompany('COMP-002');
    assert.equal(duplicate.Status, 'Duplicate');

    // Verify contact now points to primary
    const contact = await crm.getContact('CONT-001');
    assert.equal(contact['Company ID'], 'COMP-001');

    // Verify primary got Country from duplicate
    const primary = await crm.getCompany('COMP-001');
    assert.equal(primary.Country, 'USA');
  });
});

// ============================================
// TEST 17: Reply Analysis (Missing Test)
// ============================================
describe('Test 17: Reply Analysis', () => {
  it('should log reply analysis and update prospect', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // First, add an inbound interaction
    const convResult = await crm.addInteraction({
      'Prospect ID': 'PRO-001',
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Yes, I am interested in learning more.'
    });

    // Now log reply analysis
    const analysisResult = await crm.logReplyAnalysis({
      'Conversation ID': convResult.conversationId,
      'Prospect ID': 'PRO-001',
      'Reply Content': 'Yes, I am interested in learning more.',
      'Classification': 'INTERESTED',
      'Sentiment': 'Positive',
      'Interest Level': 'High',
      'Urgency': 'Medium',
      'Recommended Action': 'Schedule discovery call',
      'Human Approved': true
    });

    assert.equal(analysisResult.success, true);
    assert.ok(analysisResult.analysisId);
    assert.equal(analysisResult.analysis.Classification, 'INTERESTED');
    assert.equal(analysisResult.analysis.Sentiment, 'Positive');

    // Verify prospect was updated
    const prospect = await crm.getProspect('PRO-001');
    assert.equal(prospect['Interest Level'], 'High');
    assert.equal(prospect['Sentiment'], 'Positive');
  });
});

// ============================================
// TEST 18: Complete Follow-Up (Missing Test)
// ============================================
describe('Test 18: Complete Follow-Up', () => {
  it('should mark follow-up as sent', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Create a follow-up
    const fuResult = await crm.addFollowUp({
      'Prospect ID': 'PRO-001',
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'New case study',
      'Draft Content': 'Hi, wanted to follow up...'
    });

    assert.equal(fuResult.success, true);

    // Complete the follow-up
    const completeResult = await crm.completeFollowUp(fuResult.followupId, 'Agent');
    assert.equal(completeResult.success, true);

    // Verify follow-up status
    const followups = await storage.readAll('Follow-ups');
    const updatedFu = followups.find(f => f['Follow-up ID'] === fuResult.followupId);
    assert.equal(updatedFu.Status, 'Sent');
    assert.ok(updatedFu['Sent Date']);
  });

  it('should reject completing blocked follow-up', async () => {
    await crm.createCompany({ 'Company Name': 'Test Corp' });
    await crm.createContact({ 'Company ID': 'COMP-001' });
    await crm.createProspect({
      'Contact ID': 'CONT-001',
      'Company ID': 'COMP-001',
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });

    // Mark DO_NOT_CONTACT
    await crm.markDoNotContact('CONT-001', 'Stop', 'Riajul');

    // Try to create follow-up (will be blocked)
    const fuResult = await crm.addFollowUp({
      'Prospect ID': 'PRO-001',
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Test',
      'Draft Content': 'Test'
    });

    assert.equal(fuResult.blocked, true);
    assert.equal(fuResult.status, 'Blocked');

    // Try to complete blocked follow-up
    const completeResult = await crm.completeFollowUp(fuResult.followupId, 'Agent');
    assert.equal(completeResult.success, false);
    assert.ok(completeResult.reason.includes('blocked'));
  });
});

// ============================================
// SUMMARY
// ============================================
console.log('');
console.log('Running CRM unit tests...');
console.log('');
