/**
 * Agent → CRM Integration Tests
 * 
 * Tests the tool execution layer that bridges the AI agent to the CRM service.
 * 
 * Test categories:
 * 1. Tool registration (all tools registered, unknown rejected)
 * 2. Tool execution (valid args succeed, invalid rejected)
 * 3. Workflow (lead → prospect → outreach → reply → stage → follow-up → completion)
 * 4. Safety (DNC, stage transitions, duplicates, unknown tools, malformed args)
 * 5. Human approval (agent cannot send outbound without approval)
 * 6. End-to-end (complete deterministic scenario)
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryAdapter } from '../../src/storage/memory.js';
import { CRMService } from '../../src/service/crm.js';
import { ToolExecutor } from '../../src/tools/executor.js';
import { TOOL_SCHEMAS, getAllToolSchemas } from '../../src/tools/schemas.js';

// Helper: create a fresh tool executor with empty memory storage
function createTestExecutor() {
  const storage = new MemoryAdapter();
  const crm = new CRMService(storage);
  const executor = new ToolExecutor(crm);
  return { executor, crm, storage };
}

// Helper: create a company + contact and return their IDs
async function seedCompanyAndContact(executor) {
  const companyResult = await executor.execute('create_company', {
    'Company Name': 'Test Corp',
    'Website': 'https://testcorp.com',
    'Industry': 'Technology'
  });
  assert.ok(companyResult.success, `Company creation failed: ${companyResult.error || JSON.stringify(companyResult)}`);

  const contactResult = await executor.execute('create_contact', {
    'Company ID': companyResult.companyId,
    'Contact Name': 'John Doe',
    'Email': 'john@testcorp.com',
    'Role': 'CEO'
  });
  assert.ok(contactResult.success, `Contact creation failed: ${contactResult.error || JSON.stringify(contactResult)}`);

  return { companyId: companyResult.companyId, contactId: contactResult.contactId };
}

// Helper: create a prospect and return its ID
async function seedProspect(executor, companyId, contactId) {
  const result = await executor.execute('create_prospect', {
    'Company ID': companyId,
    'Contact ID': contactId,
    'Priority': 'A',
    'Priority Reason': 'Strong fit',
    'ICP Segment': 'Primary',
    'Service': 'Meta Ads Management',
    'Opportunity': 'No ads running',
    'Research Evidence': 'Checked ad library',
    'Portfolio Proof': 'Similar case study'
  });
  assert.ok(result.success, `Prospect creation failed: ${result.error || JSON.stringify(result)}`);
  return result.prospectId;
}

// ============================================
// SUITE 1: TOOL REGISTRATION
// ============================================
describe('Tool Registration', () => {
  it('should have all 15 required tools registered', () => {
    const { executor } = createTestExecutor();
    const tools = executor.getRegisteredTools();

    const required = [
      'create_company', 'create_contact', 'create_prospect',
      'get_prospect', 'search_prospects', 'update_prospect',
      'update_stage', 'add_interaction', 'log_reply_analysis',
      'add_follow_up', 'complete_follow_up', 'mark_do_not_contact',
      'check_do_not_contact', 'add_referral', 'get_prospect_history'
    ];

    for (const tool of required) {
      assert.ok(executor.hasTool(tool), `Missing tool: ${tool}`);
    }

    assert.equal(tools.length, 15, `Expected 15 tools, got ${tools.length}`);
  });

  it('should reject unknown tools', async () => {
    const { executor } = createTestExecutor();
    const result = await executor.execute('delete_everything', {});
    assert.equal(result.success, false);
    assert.ok(result.error.includes('Unknown tool'));
    assert.ok(result.availableTools.length > 0);
  });

  it('should reject arbitrary tool names', async () => {
    const { executor } = createTestExecutor();
    
    // Try various injection-style tool names
    const malicious = ['eval', 'exec', 'require', 'import', '__proto__', 'constructor', 'prototype'];
    for (const name of malicious) {
      const result = await executor.execute(name, {});
      assert.equal(result.success, false, `Tool "${name}" should be rejected`);
    }
  });

  it('should have schemas for all registered tools', () => {
    const { executor } = createTestExecutor();
    for (const toolName of executor.getRegisteredTools()) {
      const schema = executor.getToolSchema(toolName);
      assert.ok(schema, `No schema for tool: ${toolName}`);
      assert.ok(schema.name, `Schema missing name for: ${toolName}`);
      assert.ok(schema.description, `Schema missing description for: ${toolName}`);
      assert.ok(schema.inputSchema, `Schema missing inputSchema for: ${toolName}`);
    }
  });

  it('should export all tool schemas correctly', () => {
    const allSchemas = getAllToolSchemas();
    assert.equal(allSchemas.length, 15);
    for (const schema of allSchemas) {
      assert.ok(schema.name);
      assert.ok(schema.inputSchema);
    }
  });
});

// ============================================
// SUITE 2: TOOL EXECUTION — Valid & Invalid
// ============================================
describe('Tool Execution', () => {
  describe('create_company', () => {
    it('should create a company with valid args', async () => {
      const { executor } = createTestExecutor();
      const result = await executor.execute('create_company', {
        'Company Name': 'Acme Corp',
        'Website': 'https://acme.com',
        'Industry': 'Manufacturing'
      });
      assert.equal(result.success, true);
      assert.ok(result.companyId);
      assert.ok(result.company);
    });

    it('should reject missing required fields', async () => {
      const { executor } = createTestExecutor();
      const result = await executor.execute('create_company', {});
      assert.equal(result.success, false);
      assert.ok(result.validationErrors.length > 0);
    });

    it('should reject unknown fields', async () => {
      const { executor } = createTestExecutor();
      const result = await executor.execute('create_company', {
        'Company Name': 'Test',
        'Malicious Field': 'bad data'
      });
      assert.equal(result.success, false);
      assert.ok(result.validationErrors.some(e => e.includes('Unknown field')));
    });

    it('should reject wrong types', async () => {
      const { executor } = createTestExecutor();
      const result = await executor.execute('create_company', {
        'Company Name': 12345  // Should be string
      });
      assert.equal(result.success, false);
    });
  });

  describe('create_contact', () => {
    it('should create a contact for an existing company', async () => {
      const { executor } = createTestExecutor();
      const { companyId } = await seedCompanyAndContact(executor);
      // Company was created in seed, create a new contact
      const result = await executor.execute('create_contact', {
        'Company ID': companyId,
        'Contact Name': 'Jane Smith',
        'Email': 'jane@testcorp.com',
        'Role': 'CTO'
      });
      assert.equal(result.success, true);
      assert.ok(result.contactId);
    });

    it('should fail if company does not exist', async () => {
      const { executor } = createTestExecutor();
      const result = await executor.execute('create_contact', {
        'Company ID': 'COMP-999',
        'Contact Name': 'Nobody'
      });
      assert.equal(result.success, false);
      assert.ok(result.error.includes('Company not found'));
    });
  });

  describe('create_prospect', () => {
    it('should create a prospect with valid data', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const result = await executor.execute('create_prospect', {
        'Company ID': companyId,
        'Contact ID': contactId,
        'Priority': 'A',
        'Priority Reason': 'Strong fit',
        'ICP Segment': 'Primary',
        'Service': 'Meta Ads Management',
        'Opportunity': 'No ads running',
        'Research Evidence': 'Ad library shows no activity',
        'Portfolio Proof': 'Similar clinic case study'
      });
      assert.equal(result.success, true);
      assert.ok(result.prospectId);
    });

    it('should reject invalid priority', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const result = await executor.execute('create_prospect', {
        'Company ID': companyId,
        'Contact ID': contactId,
        'Priority': 'X',  // Invalid
        'Priority Reason': 'test',
        'ICP Segment': 'Primary',
        'Service': 'Meta Ads Management',
        'Opportunity': 'test',
        'Research Evidence': 'test',
        'Portfolio Proof': 'test'
      });
      // Schema validation should reject this
      assert.equal(result.success, false);
      assert.ok(result.validationErrors.some(e => e.includes('Priority')));
    });

    it('should reject invalid service enum', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const result = await executor.execute('create_prospect', {
        'Company ID': companyId,
        'Contact ID': contactId,
        'Priority': 'A',
        'Priority Reason': 'test',
        'ICP Segment': 'Primary',
        'Service': 'Dog Walking',  // Not a valid service
        'Opportunity': 'test',
        'Research Evidence': 'test',
        'Portfolio Proof': 'test'
      });
      assert.equal(result.success, false);
      assert.ok(result.validationErrors.some(e => e.includes('Service')));
    });
  });

  describe('update_stage', () => {
    it('should allow valid stage transitions', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const prospectId = await seedProspect(executor, companyId, contactId);

      // NEW → RESEARCHED is valid
      const result = await executor.execute('update_stage', {
        'Prospect ID': prospectId,
        'New Stage': 'RESEARCHED',
        'Reason': 'Initial research completed'
      });
      assert.equal(result.success, true);
    });

    it('should reject missing reason', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const prospectId = await seedProspect(executor, companyId, contactId);

      const result = await executor.execute('update_stage', {
        'Prospect ID': prospectId,
        'New Stage': 'RESEARCHED'
        // Missing 'Reason'
      });
      assert.equal(result.success, false);
      assert.ok(result.validationErrors.some(e => e.includes('Reason')));
    });

    it('should reject invalid stage transitions', async () => {
      const { executor } = createTestExecutor();
      const { companyId, contactId } = await seedCompanyAndContact(executor);
      const prospectId = await seedProspect(executor, companyId, contactId);

      // NEW → WON is invalid
      const result = await executor.execute('update_stage', {
        'Prospect ID': prospectId,
        'New Stage': 'WON',
        'Reason': 'Trying to skip pipeline'
      });
      assert.equal(result.success, false);
      assert.ok(result.blocked);
    });
  });
});

// ============================================
// SUITE 3: WORKFLOW
// ============================================
describe('Agent Workflow', () => {
  it('should complete: Lead → Prospect creation', async () => {
    const { executor } = createTestExecutor();
    
    // Step 1: Create company
    const companyResult = await executor.execute('create_company', {
      'Company Name': 'Bright Smile Dental',
      'Website': 'https://brightsmile.com',
      'Industry': 'Healthcare'
    });
    assert.equal(companyResult.success, true);

    // Step 2: Create contact
    const contactResult = await executor.execute('create_contact', {
      'Company ID': companyResult.companyId,
      'Contact Name': 'Dr. Sarah Jones',
      'Email': 'sarah@brightsmile.com',
      'Role': 'Owner'
    });
    assert.equal(contactResult.success, true);

    // Step 3: Create prospect
    const prospectResult = await executor.execute('create_prospect', {
      'Company ID': companyResult.companyId,
      'Contact ID': contactResult.contactId,
      'Priority': 'A',
      'Priority Reason': 'Dental clinic with no Meta ads running',
      'ICP Segment': 'Primary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'No ads running in ad library',
      'Research Evidence': 'Checked Meta ad library — no active ads',
      'Portfolio Proof': 'Aesthetica Cosmetic Clinic case study'
    });
    assert.equal(prospectResult.success, true);
    assert.ok(prospectResult.prospectId);
  });

  it('should complete: Prospect → Outreach logging', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Move to outreach-ready stage first
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'RESEARCHED',
      'Reason': 'Research done'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'QUALIFIED',
      'Reason': 'Qualified'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'OUTREACH_READY',
      'Reason': 'Ready for outreach'
    });

    // Log outbound interaction (human-approved)
    const result = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Hi Dr. Jones, I noticed your clinic...',
      'Message Subject': 'Meta Ads for Bright Smile',
      'Human Approved': true
    });
    assert.equal(result.success, true);
  });

  it('should complete: Inbound reply → Reply analysis', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // First, move to CONTACTED stage
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'RESEARCHED',
      'Reason': 'Research done'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'QUALIFIED',
      'Reason': 'Qualified'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'OUTREACH_READY',
      'Reason': 'Ready for outreach'
    });

    // Log outbound
    const outbound = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Initial outreach',
      'Message Subject': 'Subject',
      'Human Approved': true
    });
    assert.equal(outbound.success, true);

    // Move to CONTACTED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'CONTACTED',
      'Reason': 'Email sent'
    });

    // Log inbound reply
    const inbound = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Thanks for reaching out, I am interested...'
    });
    assert.equal(inbound.success, true);

    // Move to REPLIED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'REPLIED',
      'Reason': 'Reply received'
    });

    // Log reply analysis
    const analysis = await executor.execute('log_reply_analysis', {
      'Prospect ID': prospectId,
      'Conversation ID': inbound.conversationId,
      'Reply Content': 'Thanks for reaching out, I am interested in learning more',
      'Classification': 'INTERESTED',
      'Sentiment': 'Positive',
      'Interest Level': 'High',
      'Urgency': 'Medium',
      'Recommended Action': 'Schedule a discovery call'
    });
    assert.equal(analysis.success, true);
    assert.ok(analysis.analysisId);
  });

  it('should complete: Stage → Follow-up → Completion', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Move through stages to CONTACTED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'RESEARCHED',
      'Reason': 'Research done'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'QUALIFIED',
      'Reason': 'Qualified'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'OUTREACH_READY',
      'Reason': 'Ready for outreach'
    });

    // Log outbound
    await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Outreach email',
      'Message Subject': 'Subject',
      'Human Approved': true
    });

    // Move to CONTACTED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'CONTACTED',
      'Reason': 'Email sent'
    });

    // Create follow-up
    const fuResult = await executor.execute('add_follow_up', {
      'Prospect ID': prospectId,
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Case study from similar business',
      'Draft Content': 'Following up on my previous email...'
    });
    assert.equal(fuResult.success, true);
    assert.ok(fuResult.followupId);

    // Complete follow-up
    const completeResult = await executor.execute('complete_follow_up', {
      'Follow-up ID': fuResult.followupId
    });
    assert.equal(completeResult.success, true);
  });
});

// ============================================
// SUITE 4: SAFETY
// ============================================
describe('Safety Boundaries', () => {
  it('should reject outbound action on DO_NOT_CONTACT contact', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Mark as DO_NOT_CONTACT
    const dncResult = await executor.execute('mark_do_not_contact', {
      'Contact ID': contactId,
      'Reason': 'Asked to stop contacting'
    });
    assert.equal(dncResult.success, true);

    // Try to send outbound — should be blocked by CRMService
    const outboundResult = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Trying to send anyway',
      'Message Subject': 'Test',
      'Human Approved': true
    });
    assert.equal(outboundResult.success, false);
    assert.ok(outboundResult.blocked);
    assert.ok(outboundResult.reason.includes('DO_NOT_CONTACT'));
  });

  it('should reject follow-up creation for DO_NOT_CONTACT contact', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Mark DO_NOT_CONTACT
    await executor.execute('mark_do_not_contact', {
      'Contact ID': contactId,
      'Reason': 'Unsubscribed'
    });

    // Try to create follow-up — should be blocked
    const result = await executor.execute('add_follow_up', {
      'Prospect ID': prospectId,
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Test',
      'Draft Content': 'Test content'
    });
    assert.equal(result.success, false);
    assert.ok(result.blocked);
  });

  it('should reject invalid stage transitions', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // NEW → WON should fail
    const result = await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'WON',
      'Reason': 'Skip pipeline'
    });
    assert.equal(result.success, false);
    assert.ok(result.blocked);
  });

  it('should reject duplicate prospect creation', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);

    // First prospect should succeed
    const result1 = await executor.execute('create_prospect', {
      'Company ID': companyId,
      'Contact ID': contactId,
      'Priority': 'A',
      'Priority Reason': 'Strong fit',
      'ICP Segment': 'Primary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'No ads running',
      'Research Evidence': 'Evidence',
      'Portfolio Proof': 'Proof'
    });
    assert.equal(result1.success, true);

    // Second prospect (same contact + service) should be blocked as duplicate
    const result2 = await executor.execute('create_prospect', {
      'Company ID': companyId,
      'Contact ID': contactId,
      'Priority': 'B',
      'Priority Reason': 'Second attempt',
      'ICP Segment': 'Secondary',
      'Service': 'Meta Ads Management',  // Same service = duplicate
      'Opportunity': 'Different opportunity',
      'Research Evidence': 'More evidence',
      'Portfolio Proof': 'More proof'
    });
    assert.equal(result2.success, false);
    assert.ok(result2.blocked);
    assert.ok(result2.reason.includes('Duplicate'));
  });

  it('should reject malformed arguments', async () => {
    const { executor } = createTestExecutor();

    // Pass array instead of object
    const result1 = await executor.execute('create_company', []);
    assert.equal(result1.success, false);
    assert.ok(result1.validationErrors);

    // Pass null
    const result2 = await executor.execute('create_company', null);
    assert.equal(result2.success, false);

    // Pass string
    const result3 = await executor.execute('create_company', 'test');
    assert.equal(result3.success, false);
  });

  it('should check DO_NOT_CONTACT status correctly', async () => {
    const { executor } = createTestExecutor();
    const { contactId } = await seedCompanyAndContact(executor);

    // Check before marking
    const check1 = await executor.execute('check_do_not_contact', {
      'Contact ID': contactId
    });
    assert.equal(check1.success, true);
    assert.equal(check1.blocked, false);

    // Mark as DO_NOT_CONTACT
    await executor.execute('mark_do_not_contact', {
      'Contact ID': contactId,
      'Reason': 'Requested to stop'
    });

    // Check after marking
    const check2 = await executor.execute('check_do_not_contact', {
      'Contact ID': contactId
    });
    assert.equal(check2.success, true);
    assert.equal(check2.blocked, true);
  });

  it('should reject blocked follow-up completion', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Mark DO_NOT_CONTACT first
    await executor.execute('mark_do_not_contact', {
      'Contact ID': contactId,
      'Reason': 'Unsubscribed'
    });

    // Follow-up will be created but blocked
    const fuResult = await executor.execute('add_follow_up', {
      'Prospect ID': prospectId,
      'Follow-up Type': 'No Response',
      'Scheduled Date': '2026-09-25',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Test',
      'Draft Content': 'Test'
    });
    assert.ok(fuResult.blocked);

    // Try to complete the blocked follow-up — should fail
    const completeResult = await executor.execute('complete_follow_up', {
      'Follow-up ID': fuResult.followupId
    });
    assert.equal(completeResult.success, false);
    assert.ok(
      (completeResult.reason && completeResult.reason.includes('blocked')) ||
      (completeResult.error && completeResult.error.includes('blocked')),
      `Expected blocked error, got: ${JSON.stringify(completeResult)}`
    );
  });
});

// ============================================
// SUITE 5: HUMAN APPROVAL BOUNDARY
// ============================================
describe('Human Approval Boundary', () => {
  it('should reject outbound interaction without human approval', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Try to send outbound WITHOUT human approval
    const result = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Trying to send without approval',
      'Message Subject': 'Test',
      'Human Approved': false  // NOT approved
    });
    assert.equal(result.success, false);
    // CRMService should reject this — outbound requires human approval
    assert.ok(result.error || result.blocked);
  });

  it('should allow inbound interactions without human approval', async () => {
    const { executor } = createTestExecutor();
    const { companyId, contactId } = await seedCompanyAndContact(executor);
    const prospectId = await seedProspect(executor, companyId, contactId);

    // Inbound should not require human approval
    const result = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Reply from prospect'
    });
    assert.equal(result.success, true);
  });

  it('should not have any tool that directly sends emails or messages', () => {
    const { executor } = createTestExecutor();
    const tools = executor.getRegisteredTools();

    // None of these should exist
    const dangerousTools = [
      'send_email', 'send_linkedin_message', 'send_message',
      'auto_outreach', 'bulk_send', 'dispatch_email'
    ];

    for (const tool of dangerousTools) {
      assert.ok(!executor.hasTool(tool), `Dangerous tool should not exist: ${tool}`);
    }
  });
});

// ============================================
// SUITE 6: END-TO-END INTEGRATION TEST
// ============================================
describe('End-to-End Integration', () => {
  it('should complete full prospect lifecycle with MemoryAdapter', async () => {
    const { executor, crm, storage } = createTestExecutor();

    // Step 1: Create company
    const company = await executor.execute('create_company', {
      'Company Name': 'Elegant Aesthetics Clinic',
      'Website': 'https://elegantaesthetics.com',
      'Industry': 'Healthcare & Beauty',
      'Country': 'Australia',
      'City': 'Sydney'
    });
    assert.equal(company.success, true);
    assert.ok(company.companyId);

    // Step 2: Create contact
    const contact = await executor.execute('create_contact', {
      'Company ID': company.companyId,
      'Contact Name': 'Dr. Emily Chen',
      'Email': 'emily@elegantaesthetics.com',
      'Role': 'Clinic Director',
      'Decision Maker Status': 'Decision-maker'
    });
    assert.equal(contact.success, true);
    assert.ok(contact.contactId);

    // Step 3: Create prospect
    const prospect = await executor.execute('create_prospect', {
      'Company ID': company.companyId,
      'Contact ID': contact.contactId,
      'Priority': 'A',
      'Priority Reason': 'Beauty clinic with no Meta ads — strong fit for Meta Ads Management',
      'ICP Segment': 'Primary',
      'Service': 'Meta Ads Management',
      'Opportunity': 'No active ads in Meta Ad Library, clinic has 5K+ followers but no paid promotion',
      'Research Evidence': 'Checked Meta Ad Library — zero active ads. Instagram has 5K followers but organic only.',
      'Portfolio Proof': 'Aesthetica Cosmetic Clinic: 3x ROAS in 60 days with similar clinic'
    });
    assert.equal(prospect.success, true);
    const prospectId = prospect.prospectId;

    // Step 4: Check DO_NOT_CONTACT (should be clear)
    const dncCheck = await executor.execute('check_do_not_contact', {
      'Contact ID': contact.contactId
    });
    assert.equal(dncCheck.success, true);
    assert.equal(dncCheck.blocked, false);

    // Step 5: Move through pipeline to CONTACTED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'RESEARCHED',
      'Reason': 'Initial research complete'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'QUALIFIED',
      'Reason': 'ICP match confirmed, decision maker identified'
    });
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'OUTREACH_READY',
      'Reason': 'Personalization complete, draft approved'
    });

    // Step 6: Log approved outbound interaction
    const outbound = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Outbound',
      'Message Channel': 'Email',
      'Message Content': 'Hi Dr. Chen, I noticed Elegant Aesthetics has a strong Instagram presence...',
      'Message Subject': 'Meta Ads opportunity for Elegant Aesthetics',
      'Human Approved': true
    });
    assert.equal(outbound.success, true);

    // Move to CONTACTED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'CONTACTED',
      'Reason': 'Initial outreach email sent (human-approved)'
    });

    // Step 7: Simulate inbound response
    const inbound = await executor.execute('add_interaction', {
      'Prospect ID': prospectId,
      'Message Type': 'Inbound',
      'Message Channel': 'Email',
      'Message Content': 'Thanks for reaching out. We have been considering paid ads but not sure where to start. Can you tell me more about your approach?'
    });
    assert.equal(inbound.success, true);

    // Move to REPLIED
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'REPLIED',
      'Reason': 'Prospect replied showing interest'
    });

    // Step 8: Log reply analysis
    const analysis = await executor.execute('log_reply_analysis', {
      'Prospect ID': prospectId,
      'Conversation ID': inbound.conversationId,
      'Reply Content': 'We have been considering paid ads but not sure where to start',
      'Classification': 'INTERESTED',
      'Sentiment': 'Positive',
      'Interest Level': 'High',
      'Urgency': 'Medium',
      'Recommended Action': 'Send case study and schedule discovery call'
    });
    assert.equal(analysis.success, true);

    // Step 9: Update pipeline stage
    await executor.execute('update_stage', {
      'Prospect ID': prospectId,
      'New Stage': 'CONVERSATION',
      'Reason': 'Active conversation, prospect interested in learning more'
    });

    // Step 10: Create follow-up
    const followUp = await executor.execute('add_follow_up', {
      'Prospect ID': prospectId,
      'Follow-up Type': 'Proposal Follow-up',
      'Scheduled Date': '2026-09-20',
      'Follow-up Number': 1,
      'Channel': 'Email',
      'Value Angle': 'Aesthetica case study showing 3x ROAS for similar clinic',
      'Draft Content': 'Hi Dr. Chen, following up on our conversation. Here is the Aesthetica case study...'
    });
    assert.equal(followUp.success, true);
    assert.ok(followUp.followupId);

    // Step 11: Complete follow-up
    const completeResult = await executor.execute('complete_follow_up', {
      'Follow-up ID': followUp.followupId
    });
    assert.equal(completeResult.success, true);

    // Step 12: Retrieve prospect history and verify everything
    const history = await executor.execute('get_prospect_history', {
      'Prospect ID': prospectId
    });
    assert.equal(history.success, true);
    assert.ok(history.prospect);
    assert.ok(history.contact);
    assert.ok(history.company);
    assert.ok(history.followups.length > 0);
    assert.ok(history.auditTrail.length > 0);

    // Verify CRM records exist in storage
    const prospects = await storage.readAll('Prospects');
    assert.equal(prospects.length, 1);
    assert.equal(prospects[0]['Prospect ID'], prospectId);

    const companies = await storage.readAll('Companies');
    assert.equal(companies.length, 1);

    const contacts = await storage.readAll('Contacts');
    assert.equal(contacts.length, 1);

    const conversations = await storage.readAll('Conversations');
    assert.ok(conversations.length >= 2, 'Should have at least outbound + inbound');

    const auditLog = await storage.readAll('Audit Log');
    assert.ok(auditLog.length > 0, 'Audit log should have entries');

    // Verify the complete audit trail exists
    const prospectAudit = auditLog.filter(
      entry => entry['Entity ID'] === prospectId || entry['Entity ID'] === company.companyId || entry['Entity ID'] === contact.contactId
    );
    assert.ok(prospectAudit.length >= 5, 'Should have multiple audit entries for the prospect lifecycle');
  });

  it('should maintain data integrity across multiple operations', async () => {
    const { executor, storage } = createTestExecutor();

    // Create two companies
    const company1 = await executor.execute('create_company', { 'Company Name': 'Company A' });
    const company2 = await executor.execute('create_company', { 'Company Name': 'Company B' });
    assert.equal(company1.success, true);
    assert.equal(company2.success, true);
    assert.notEqual(company1.companyId, company2.companyId);

    // Verify both exist in storage
    const companies = await storage.readAll('Companies');
    assert.equal(companies.length, 2);

    // Create contacts for each
    const contact1 = await executor.execute('create_contact', {
      'Company ID': company1.companyId,
      'Contact Name': 'Person A',
      'Email': 'a@companya.com'
    });
    const contact2 = await executor.execute('create_contact', {
      'Company ID': company2.companyId,
      'Contact Name': 'Person B',
      'Email': 'b@companyb.com'
    });
    assert.equal(contact1.success, true);
    assert.equal(contact2.success, true);

    // Verify contacts in storage
    const contacts = await storage.readAll('Contacts');
    assert.equal(contacts.length, 2);
  });
});
