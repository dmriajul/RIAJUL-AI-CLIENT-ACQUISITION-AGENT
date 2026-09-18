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

// Tools (Agent Integration Layer)
export { ToolExecutor } from './tools/executor.js';
export { TOOL_SCHEMAS, getAllToolSchemas, getToolSchema } from './tools/schemas.js';

/**
 * Create a CRM instance with in-memory storage (for testing)
 * Note: This is async because ESM requires dynamic imports
 */
export async function createTestCRM() {
  const { MemoryAdapter } = await import('./storage/memory.js');
  const { CRMService } = await import('./service/crm.js');
  const storage = new MemoryAdapter();
  return new CRMService(storage);
}

/**
 * Create a test CRM synchronously (helper that uses already-imported classes)
 */
export function createTestCRMSync(MemoryAdapterClass, CRMServiceClass) {
  const storage = new MemoryAdapterClass();
  return new CRMServiceClass(storage);
}

/**
 * Create a full tool executor with in-memory storage (for testing)
 */
export async function createTestToolExecutor() {
  const { MemoryAdapter } = await import('./storage/memory.js');
  const { CRMService } = await import('./service/crm.js');
  const { ToolExecutor } = await import('./tools/executor.js');
  
  const storage = new MemoryAdapter();
  const crm = new CRMService(storage);
  return new ToolExecutor(crm);
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

/**
 * Create a full tool executor with Google Sheets storage (for production)
 */
export async function createProductionToolExecutor() {
  const { CRMService } = await import('./service/crm.js');
  const { ToolExecutor } = await import('./tools/executor.js');
  
  const storage = await createFromEnv();
  await storage.connect();
  const crm = new CRMService(storage);
  return new ToolExecutor(crm);
}
