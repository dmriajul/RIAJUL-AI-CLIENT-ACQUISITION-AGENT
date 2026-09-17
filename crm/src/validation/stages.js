/**
 * Stage Transition Rules
 * 
 * Enforces valid pipeline stage transitions.
 * Based on crm/stage-transitions.md
 */

import { VALID_PIPELINE_STAGES } from './constants.js';

/**
 * Valid transitions map: FROM -> [allowed TO stages]
 */
export const STAGE_TRANSITIONS = {
  NEW: ['RESEARCHED', 'DISQUALIFIED'],
  RESEARCHED: ['QUALIFIED', 'DISQUALIFIED'],
  QUALIFIED: ['OUTREACH_READY', 'DISQUALIFIED'],
  OUTREACH_READY: ['CONTACTED', 'DISQUALIFIED'],
  CONTACTED: ['FOLLOW_UP_1', 'REPLIED', 'NURTURE', 'DISQUALIFIED'],
  FOLLOW_UP_1: ['FOLLOW_UP_2', 'REPLIED', 'NURTURE', 'DISQUALIFIED'],
  FOLLOW_UP_2: ['REPLIED', 'NURTURE', 'DISQUALIFIED'],
  REPLIED: ['CONVERSATION', 'QUALIFIED', 'NURTURE', 'LOST', 'DISQUALIFIED'],
  CONVERSATION: ['MEETING', 'PROPOSAL', 'NURTURE', 'LOST'],
  MEETING: ['PROPOSAL', 'NURTURE', 'LOST'],
  PROPOSAL: ['NEGOTIATION', 'WON', 'LOST', 'NURTURE'],
  NEGOTIATION: ['WON', 'LOST', 'NURTURE'],
  WON: [],           // Terminal
  LOST: ['NURTURE'],
  NURTURE: ['RESEARCHED', 'QUALIFIED', 'OUTREACH_READY', 'LOST'],
  DISQUALIFIED: []   // Terminal
};

/**
 * Stages that involve outbound communication
 */
export const OUTBOUND_STAGES = new Set([
  'OUTREACH_READY',
  'CONTACTED',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2'
]);

/**
 * Terminal stages (no further transitions)
 */
export const TERMINAL_STAGES = new Set(['WON', 'DISQUALIFIED']);

/**
 * Check if a stage transition is valid
 * @param {string} currentStage 
 * @param {string} newStage 
 * @returns {{ valid: boolean, reason?: string, allowedStages?: string[] }}
 */
export function validateStageTransition(currentStage, newStage) {
  // Validate both stages exist
  if (!VALID_PIPELINE_STAGES.includes(currentStage)) {
    return {
      valid: false,
      reason: `Invalid current stage: ${currentStage}`
    };
  }

  if (!VALID_PIPELINE_STAGES.includes(newStage)) {
    return {
      valid: false,
      reason: `Invalid target stage: ${newStage}`
    };
  }

  // Same stage is a no-op
  if (currentStage === newStage) {
    return { valid: true };
  }

  // Check transition map
  const allowed = STAGE_TRANSITIONS[currentStage];
  
  if (!allowed.includes(newStage)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStage} to ${newStage}`,
      allowedStages: allowed
    };
  }

  return { valid: true };
}

/**
 * Check if a stage involves outbound communication
 * @param {string} stage 
 * @returns {boolean}
 */
export function isOutboundStage(stage) {
  return OUTBOUND_STAGES.has(stage);
}

/**
 * Check if a stage is terminal
 * @param {string} stage 
 * @returns {boolean}
 */
export function isTerminalStage(stage) {
  return TERMINAL_STAGES.has(stage);
}

/**
 * Get all valid next stages from current stage
 * @param {string} currentStage 
 * @returns {string[]}
 */
export function getValidNextStages(currentStage) {
  return STAGE_TRANSITIONS[currentStage] || [];
}

export default {
  STAGE_TRANSITIONS,
  OUTBOUND_STAGES,
  TERMINAL_STAGES,
  validateStageTransition,
  isOutboundStage,
  isTerminalStage,
  getValidNextStages
};
