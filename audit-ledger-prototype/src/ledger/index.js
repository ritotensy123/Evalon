/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOTYPE: Ledger Module Exports
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  THIS IS A PROTOTYPE - NOT FOR PRODUCTION USE
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { LedgerBlock, EventType, EventSeverity } = require('./LedgerBlock');
const { AuditLedger, ImmutabilityViolationError, IntegrityViolationError } = require('./AuditLedger');

module.exports = {
  // Core Classes
  LedgerBlock,
  AuditLedger,
  
  // Enums
  EventType,
  EventSeverity,
  
  // Errors
  ImmutabilityViolationError,
  IntegrityViolationError
};
