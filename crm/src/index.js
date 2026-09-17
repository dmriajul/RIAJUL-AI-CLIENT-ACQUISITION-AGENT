/**
 * CRM Main Entry Point
 * 
 * Exports all CRM components for use by the agent or other modules.
 */

// Storage adapters
export { StorageAdapter } from './storage/adapter.js';
export { MemoryAdapter } from './storage/memory.js';
export { GoogleSheetsAdapter, createFromEnv } from './storage/google-sheets.js';

// Service
export { CRMService } from './service/crm.js';

// Validation
export {
  validateCompanyCreate,
  validateContactCreate,
  validateProspectCreate,
  validateProspectUpdate,
  validateConversationCreate,
  validateReplyAnalysisCreate,
  validateFollowupCreate,
  checkTouchpointLimits,
  checkDoNotContact,
  checkDuplicateCompany,
  checkDuplicateContact,
  checkDuplicateProspect,
  ValidationResult
} from './validation/rules.js';

export {
  validateStageTransition,
  isOutboundStage,
  isTerminalStage,
  getValidNextStages,
  STAGE_TRANSITIONS
} from './validation/stages.js';

// Constants
export * from './validation/constants.js';

// Audit
export { AuditLogger } from './audit/logger.js';

/**
 * Create a CRM instance with in-memory storage (for testing)
 */
export function createTestCRM() {
  const { MemoryAdapter } = require('./storage/memory.js');
  const { CRMService } = require('./service/crm.js');
  const storage = new MemoryAdapter();
  return new CRMService(storage);
}

/**
 * Create a CRM instance with Google Sheets storage (for production)
 */
export async function createProductionCRM() {
  const storage = await createFromEnv();
  await storage.connect();
  const { CRMService } = await import('./service/crm.js');
  return new CRMService(storage);
}
