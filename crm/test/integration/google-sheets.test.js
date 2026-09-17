/**
 * Integration Tests — Google Sheets
 *
 * These tests run against a REAL Google Sheets spreadsheet.
 * They require valid credentials in environment variables.
 *
 * Run with:
 *   CRM_SPREADSHEET_ID=... GOOGLE_SERVICE_ACCOUNT_EMAIL=... GOOGLE_SERVICE_ACCOUNT_KEY=... \
 *     node --test test/integration/google-sheets.test.js
 *
 * ⚠️ WARNING: These tests will READ and WRITE to the actual spreadsheet.
 * Use a dedicated test spreadsheet, NOT production data.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import { GoogleSheetsAdapter } from '../../src/storage/google-sheets.js';
import { CRMService } from '../../src/service/crm.js';

const TEST_PREFIX = '[TEST] ';

function hasCredentials() {
  return (
    process.env.CRM_SPREADSHEET_ID &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY))
  );
}

let storage;
let crm;

before(async () => {
  if (!hasCredentials()) {
    console.log('');
    console.log('⚠️  Google Sheets credentials not configured.');
    console.log('   Set CRM_SPREADSHEET_ID + GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY');
    console.log('   Or set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json');
    console.log('   Skipping integration tests.');
    console.log('');
    return;
  }

  const { createFromEnv } = await import('../../src/storage/google-sheets.js');
  storage = await createFromEnv();
  await storage.connect();
  crm = new CRMService(storage);

  console.log('✅ Connected to Google Sheets for integration tests');
});

// ============================================
// Integration Test 1: Full CRUD Cycle
// ============================================
describe('Integration: Full CRUD Cycle', { skip: !hasCredentials() }, () => {
  let companyId, contactId, prospectId;

  after(async () => {
    // Cleanup: mark test records as Archived
    if (prospectId) {
      try {
        await storage.update('Prospects', 'Prospect ID', prospectId, { Status: 'Archived' });
      } catch (e) { /* ignore */ }
    }
    if (contactId) {
      try {
        await storage.update('Contacts', 'Contact ID', contactId, { Status: 'Archived' });
      } catch (e) { /* ignore */ }
    }
    if (companyId) {
      try {
        await storage.update('Companies', 'Company ID', companyId, { Status: 'Archived' });
      } catch (e) { /* ignore */ }
    }
  });

  it('should create company in Google Sheets', async () => {
    const result = await crm.createCompany({
      'Company Name': `${TEST_PREFIX}Integration Test Corp`,
      'Website': 'https://integration-test.example.com',
      'Industry': 'Testing',
      'Country': 'Testland'
    });

    assert.equal(result.success, true);
    assert.ok(result.companyId);
    companyId = result.companyId;

    // Verify it's actually in Google Sheets
    const retrieved = await crm.getCompany(companyId);
    assert.ok(retrieved);
    assert.equal(retrieved['Company Name'], `${TEST_PREFIX}Integration Test Corp`);
  });

  it('should create contact in Google Sheets', async () => {
    const result = await crm.createContact({
      'Company ID': companyId,
      'Contact Name': `${TEST_PREFIX}Test Contact`,
      'Role': 'Test Manager',
      'Email': `test-${Date.now()}@integration-test.example.com`
    });

    assert.equal(result.success, true);
    assert.ok(result.contactId);
    contactId = result.contactId;

    const retrieved = await crm.getContact(contactId);
    assert.ok(retrieved);
    assert.equal(retrieved['Company ID'], companyId);
  });

  it('should create prospect in Google Sheets', async () => {
    const result = await crm.createProspect({
      'Contact ID': contactId,
      'Company ID': companyId,
      'Priority': 'A',
      'Priority Reason': 'Integration test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test opportunity',
      'Research Evidence': 'Test evidence',
      'Portfolio Proof': 'Test proof'
    });

    assert.equal(result.success, true);
    assert.ok(result.prospectId);
    prospectId = result.prospectId;

    const retrieved = await crm.getProspect(prospectId);
    assert.ok(retrieved);
    assert.equal(retrieved['Pipeline Stage'], 'NEW');
    assert.equal(retrieved.Priority, 'A');
  });

  it('should persist stage transitions to Google Sheets', async () => {
    const result = await crm.updateStage(prospectId, 'RESEARCHED', 'Agent', 'Integration test transition');
    assert.equal(result.success, true);

    const retrieved = await crm.getProspect(prospectId);
    assert.equal(retrieved['Pipeline Stage'], 'RESEARCHED');
  });

  it('should persist audit log to Google Sheets', async () => {
    const allLogs = await storage.readAll('Audit Log');
    const ourLogs = allLogs.filter(l =>
      l['Entity ID'] === prospectId ||
      l['Entity ID'] === contactId ||
      l['Entity ID'] === companyId
    );

    assert.ok(ourLogs.length >= 4); // 3 CREATEs + 1 STAGE_CHANGE
  });
});

// ============================================
// Integration Test 2: DO_NOT_CONTACT Persists
// ============================================
describe('Integration: DO_NOT_CONTACT Persistence', { skip: !hasCredentials() }, () => {
  let companyId, contactId, prospectId;

  after(async () => {
    if (prospectId) {
      try { await storage.update('Prospects', 'Prospect ID', prospectId, { Status: 'Archived' }); } catch (e) {}
    }
    if (contactId) {
      try { await storage.update('Contacts', 'Contact ID', contactId, { Status: 'Archived' }); } catch (e) {}
    }
    if (companyId) {
      try { await storage.update('Companies', 'Company ID', companyId, { Status: 'Archived' }); } catch (e) {}
    }
  });

  it('should persist DO_NOT_CONTACT to Google Sheets', async () => {
    const companyResult = await crm.createCompany({
      'Company Name': `${TEST_PREFIX}DNC Test Corp ${Date.now()}`
    });
    companyId = companyResult.companyId;

    const contactResult = await crm.createContact({
      'Company ID': companyId,
      'Contact Name': `${TEST_PREFIX}DNC Contact`
    });
    contactId = contactResult.contactId;

    const prospectResult = await crm.createProspect({
      'Contact ID': contactId,
      'Company ID': companyId,
      'Priority': 'A',
      'Priority Reason': 'Test',
      'ICP Segment': 'Primary',
      'Service': 'SEO',
      'Opportunity': 'Test',
      'Research Evidence': 'Test',
      'Portfolio Proof': 'Test'
    });
    prospectId = prospectResult.prospectId;

    // Mark DO_NOT_CONTACT
    await crm.markDoNotContact(contactId, 'Integration test — requested stop', 'Riajul');

    // Verify it persists
    const retrieved = await crm.getContact(contactId);
    assert.equal(retrieved.Status, 'DO_NOT_CONTACT');

    // Verify prospect modifier updated
    const prospect = await crm.getProspect(prospectId);
    assert.equal(prospect['Stage Modifier'], 'DO_NOT_CONTACT');
  });
});

// ============================================
// Integration Test 3: Migration Persists
// ============================================
describe('Integration: Migration', { skip: !hasCredentials() }, () => {
  it('should migrate test prospects to Google Sheets', async () => {
    const testProspects = [
      {
        company: {
          name: `${TEST_PREFIX}Migration Test ${Date.now()}`,
          country: 'Testland'
        },
        contact: { name: 'Migration Test Contact' },
        priority: 'B',
        priorityReason: 'Integration test migration',
        icpSegment: 'Secondary',
        service: 'Meta Ads Management',
        opportunity: 'Test',
        researchEvidence: 'Test',
        portfolioProof: 'Test'
      }
    ];

    const results = await crm.migrateProspects(testProspects);
    assert.equal(results.companies.created, 1);
    assert.equal(results.contacts.created, 1);
    assert.equal(results.prospects.created, 1);
    assert.equal(results.errors.length, 0);
  });
});

console.log('');
console.log('CRM Integration Tests — Google Sheets');
console.log('Requires: CRM_SPREADSHEET_ID + credentials in environment');
console.log('');
