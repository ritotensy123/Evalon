#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOTYPE: Audit Ledger Demo Script
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  WARNING: THIS IS A PROTOTYPE - NOT FOR PRODUCTION USE
 * 
 * This script demonstrates the audit ledger capabilities without starting
 * the HTTP server. Use it for testing and understanding the ledger behavior.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { AuditLedger, EventType, EventSeverity } = require('./ledger');
const { EventGenerator } = require('./simulation/eventGenerator');

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  AUDIT LEDGER PROTOTYPE - DEMONSTRATION');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('');

// Create a new ledger
console.log('1️⃣  Creating new Audit Ledger...');
const ledger = new AuditLedger();
console.log(`   ✅ Genesis block created: ${ledger.genesisBlock.hash.substring(0, 32)}...`);
console.log('');

// Generate demo scenarios
console.log('2️⃣  Generating simulated exam sessions...');
const result = EventGenerator.populateLedger(ledger, 3);
console.log(`   ✅ Generated ${result.totalEvents} events across ${result.scenariosGenerated} sessions`);
console.log('');

// Display sessions
console.log('3️⃣  Session Summary:');
console.log('   ─────────────────────────────────────────────────────────────────────');
for (const session of result.sessions) {
  const trail = ledger.getSessionAuditTrail(session.sessionId);
  console.log(`   📋 ${session.sessionId}`);
  console.log(`      Type: ${session.type.toUpperCase()}`);
  console.log(`      Student: ${session.student}`);
  console.log(`      Exam: ${session.exam}`);
  console.log(`      Events: ${trail.blockCount} | Violations: ${trail.violations} | Warnings: ${trail.warnings}`);
  console.log('   ─────────────────────────────────────────────────────────────────────');
}
console.log('');

// Verify integrity
console.log('4️⃣  Verifying ledger integrity...');
const verification = ledger.verifyIntegrity();
if (verification.valid) {
  console.log(`   ✅ INTEGRITY VERIFIED - All ${verification.totalBlocks} blocks valid`);
} else {
  console.log(`   ❌ INTEGRITY VIOLATION DETECTED`);
  console.log(`      Invalid blocks: ${verification.invalidBlocks.length}`);
  console.log(`      Broken links: ${verification.brokenLinks.length}`);
}
console.log('');

// Show statistics
console.log('5️⃣  Ledger Statistics:');
const stats = ledger.getStatistics();
console.log(`   Total Blocks: ${stats.totalBlocks}`);
console.log(`   Total Sessions: ${stats.totalSessions}`);
console.log(`   Severity Counts:`);
console.log(`      Info: ${stats.severityCounts.info}`);
console.log(`      Warning: ${stats.severityCounts.warning}`);
console.log(`      Critical: ${stats.severityCounts.critical}`);
console.log(`      Violation: ${stats.severityCounts.violation}`);
console.log('');

// Show violations
const violations = ledger.getViolations();
if (violations.length > 0) {
  console.log('6️⃣  Violations Detected:');
  console.log('   ─────────────────────────────────────────────────────────────────────');
  for (const v of violations) {
    console.log(`   🚨 Block #${v.index}: ${v.eventType}`);
    console.log(`      Session: ${v.sessionId}`);
    console.log(`      Summary: ${v.eventSummary}`);
    console.log(`      Time: ${v.timestampISO}`);
    console.log('   ─────────────────────────────────────────────────────────────────────');
  }
} else {
  console.log('6️⃣  No violations detected in the ledger.');
}
console.log('');

// Hash chain demonstration
console.log('7️⃣  Hash Chain Demonstration (First 5 blocks):');
console.log('   ─────────────────────────────────────────────────────────────────────');
for (let i = 0; i < Math.min(5, ledger.length); i++) {
  const block = ledger.getBlock(i);
  console.log(`   Block #${i}:`);
  console.log(`      Event: ${block.eventType}`);
  console.log(`      Prev:  ${block.previousHash.substring(0, 20)}...`);
  console.log(`      Hash:  ${block.hash.substring(0, 20)}...`);
  console.log(`      Valid: ${block.validateHash() ? '✅' : '❌'}`);
}
console.log('   ─────────────────────────────────────────────────────────────────────');
console.log('');

console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('  ⚠️  REMINDER: This is PROTOTYPE data - NOT from production');
console.log('═══════════════════════════════════════════════════════════════════════════');
console.log('');
console.log('  To start the HTTP server and UI, run: npm start');
console.log('  Then visit: http://localhost:7100');
console.log('');
