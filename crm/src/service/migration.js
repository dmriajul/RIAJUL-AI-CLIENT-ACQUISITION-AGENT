#!/usr/bin/env node
/**
 * Migration Script
 * 
 * Migrates verified test prospects from audits/5-prospect-validation-test.md
 * into the persistent CRM.
 * 
 * Usage:
 *   node src/service/migration.js                  # Dry run (in-memory)
 *   node src/service/migration.js --live           # Live (Google Sheets)
 */

import { MemoryAdapter } from '../storage/memory.js';
import { CRMService } from './crm.js';

// Test prospects from audits/5-prospect-validation-test.md
const TEST_PROSPECTS = [
  {
    company: {
      name: 'Aesthetica Cosmetic Clinic',
      website: 'https://glow.com.au/clinics/melbourne/aesthetica-cosmetic-clinic',
      industry: 'Aesthetic / Cosmetic',
      country: 'Australia',
      city: 'Melbourne (South Yarra)',
      notes: '28 Google reviews at 4.9 rating. Doctor-led clinic.'
    },
    contact: {
      name: 'Dr. David Ong',
      role: 'Medical Director',
      decisionMakerStatus: 'Decision-maker',
      notes: 'Owner and medical director'
    },
    priority: 'A',
    priorityReason: '28 reviews at 4.9 rating — low review count despite excellent rating, clear ORM opportunity',
    icpSegment: 'Tertiary',
    service: 'Local SEO & ORM',
    opportunity: 'Low review count (28) despite high rating (4.9) — ORM opportunity to increase review volume',
    researchEvidence: '28 Google reviews, 4.9 rating, South Yarra VIC, doctor-led clinic',
    portfolioProof: 'AU Medical Clinic case study (+74 reviews, +148% calls, Maps #1-3)',
    pipelineStage: 'QUALIFIED',
    outreachChannel: 'Email'
  },
  {
    company: {
      name: 'Beefcake Swimwear',
      website: 'https://www.beefcakeswimwear.com',
      industry: 'Fashion / Swimwear',
      country: 'USA',
      notes: 'Gender-neutral sustainable swimwear. Multiple products sold out. Instagram: @beefcakeswimwear'
    },
    contact: {
      name: 'Mel Brittner Wells',
      role: 'Founder',
      decisionMakerStatus: 'Decision-maker',
      notes: 'Founder, gender-neutral sustainable swimwear, LGBTQ+ owned'
    },
    priority: 'A',
    priorityReason: 'Female-founded, sustainable fashion, multiple products sold out — strong Meta Ads opportunity',
    icpSegment: 'Secondary',
    service: 'Meta Ads Management',
    opportunity: 'Multiple products sold out — Meta Ads could drive consistent traffic and reduce dependency on organic',
    researchEvidence: 'Gender-neutral swimwear, XS-5X sizing, LGBTQ+ owned, 100% recycled polyester, featured in Forbes/Teen Vogue/Cosmopolitan',
    portfolioProof: 'Spreka case study (214K reach, €1.40 CPM), Salient Shop (344 sales in 7 days)',
    pipelineStage: 'QUALIFIED',
    outreachChannel: 'Email'
  },
  {
    company: {
      name: 'City Aesthetic Australia',
      website: 'https://reviews.birdeye.com/city-aesthetic-australia',
      industry: 'Aesthetic / Cosmetic',
      country: 'Australia',
      city: 'Sydney',
      notes: '47 Google reviews at 4.5 rating. Contact name NOT VERIFIED.'
    },
    contact: {
      name: 'Not verified',
      role: '',
      decisionMakerStatus: 'Unknown',
      notes: 'Contact name not verified — need to research decision-maker'
    },
    priority: 'B',
    priorityReason: '47 reviews at 4.5 rating — established clinic, potential for Meta Ads to drive bookings',
    icpSegment: 'Tertiary',
    service: 'Meta Ads Management',
    opportunity: 'Established clinic with good review volume — Meta Ads could increase booking rate',
    researchEvidence: '47 Google reviews, 4.5 rating, Sydney CBD location, services: fillers, injectables, NCTF',
    portfolioProof: 'AU Medical Clinic case study (relevant industry)',
    pipelineStage: 'QUALIFIED',
    outreachChannel: 'Email'
  },
  {
    company: {
      name: 'Clothing Connection',
      website: 'https://www.clothingconnectiononline.com',
      industry: 'Menswear / Retail',
      country: 'USA',
      city: 'Aurora, CO',
      notes: 'Family-run since 1989/2004. DISQUALIFIED — already has proven agency support (Inflow).'
    },
    contact: {
      name: 'Not verified',
      role: '',
      decisionMakerStatus: 'Unknown',
      notes: 'Not researched — company disqualified based on existing agency evidence'
    },
    priority: 'C',
    priorityReason: 'DISQUALIFIED — Inflow case study shows 219% social ad revenue increase, 5.7x ROAS — already has proven agency support',
    icpSegment: 'Secondary',
    service: 'Meta Ads Management',
    opportunity: 'None — already has effective agency',
    researchEvidence: 'Inflow case study shows 219% social ad revenue increase, 5.7x ROAS',
    portfolioProof: 'N/A — disqualified',
    pipelineStage: 'DISQUALIFIED',
    outreachChannel: ''
  }
];

async function runMigration(live = false) {
  console.log('='.repeat(60));
  console.log('CRM Migration — Test Prospects');
  console.log('='.repeat(60));
  console.log(`Mode: ${live ? 'LIVE (Google Sheets)' : 'DRY RUN (in-memory)'}`);
  console.log(`Prospects to migrate: ${TEST_PROSPECTS.length}`);
  console.log('');

  let storage;
  let crm;

  if (live) {
    try {
      const { createFromEnv } = await import('../storage/google-sheets.js');
      storage = await createFromEnv();
      await storage.connect();
      crm = new CRMService(storage);
      console.log('✅ Connected to Google Sheets');
    } catch (err) {
      console.error('❌ Failed to connect to Google Sheets:', err.message);
      console.error('');
      console.error('Run without --live for a dry run using in-memory storage.');
      process.exit(1);
    }
  } else {
    storage = new MemoryAdapter();
    crm = new CRMService(storage);
    console.log('✅ Using in-memory storage (dry run)');
  }

  console.log('');
  console.log('Migrating...');
  console.log('');

  const results = await crm.migrateProspects(TEST_PROSPECTS);

  // Report
  console.log('='.repeat(60));
  console.log('MIGRATION RESULTS');
  console.log('='.repeat(60));
  console.log(`Companies created: ${results.companies.created}`);
  console.log(`Companies skipped (duplicate): ${results.companies.skipped}`);
  console.log(`Contacts created: ${results.contacts.created}`);
  console.log(`Contacts skipped (duplicate): ${results.contacts.skipped}`);
  console.log(`Prospects created: ${results.prospects.created}`);
  console.log(`Prospects skipped (duplicate): ${results.prospects.skipped}`);
  console.log(`Audit log entries: ${results.auditEntries}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('');
    console.log('ERRORS:');
    for (const err of results.errors) {
      console.log(`  - ${err.company}: ${err.error}`);
    }
  }

  console.log('');

  // Verify data
  if (!live) {
    console.log('Verifying migrated data...');
    const companies = await storage.readAll('Companies');
    const contacts = await storage.readAll('Contacts');
    const prospects = await storage.readAll('Prospects');
    const auditLog = await storage.readAll('Audit Log');

    console.log(`  Companies in storage: ${companies.length}`);
    console.log(`  Contacts in storage: ${contacts.length}`);
    console.log(`  Prospects in storage: ${prospects.length}`);
    console.log(`  Audit entries in storage: ${auditLog.length}`);

    console.log('');
    console.log('Prospect Summary:');
    for (const p of prospects) {
      console.log(`  ${p['Prospect ID']}: ${p['Company ID']} | ${p.Service} | Priority ${p.Priority} | Stage: ${p['Pipeline Stage']}`);
    }
  }

  console.log('');
  console.log('✅ Migration complete');
}

// Run
const isLive = process.argv.includes('--live');
runMigration(isLive).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
