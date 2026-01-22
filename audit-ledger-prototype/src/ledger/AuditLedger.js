/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOTYPE: AuditLedger - Immutable Blockchain-Style Audit Chain Manager
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  WARNING: THIS IS A PROTOTYPE IMPLEMENTATION
 * ⚠️  NOT CONNECTED TO PRODUCTION SYSTEMS
 * ⚠️  FOR DEMONSTRATION AND ARCHITECTURAL VALIDATION ONLY
 * 
 * This class manages the complete audit ledger chain with:
 *   - Append-only operations (no modifications/deletions)
 *   - Cryptographic hash chain verification
 *   - Session-based organization
 *   - Full audit trail reconstruction
 *   - Tamper detection capabilities
 * 
 * FUTURE REPLACEMENT POINT:
 * This manager can be adapted to interface with:
 *   - Hyperledger Fabric chaincode
 *   - Ethereum smart contracts
 *   - Custom distributed ledger networks
 *   - Cloud-based immutable storage (AWS QLDB, Azure Immutable Blob)
 * 
 * The public interface is designed to remain stable across implementations.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { v4: uuidv4 } = require('uuid');
const { LedgerBlock, EventType, EventSeverity } = require('./LedgerBlock');

/**
 * Custom error for immutability violations
 */
class ImmutabilityViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImmutabilityViolationError';
    this.code = 'IMMUTABILITY_VIOLATION';
  }
}

/**
 * Custom error for integrity violations
 */
class IntegrityViolationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'IntegrityViolationError';
    this.code = 'INTEGRITY_VIOLATION';
    this.details = details;
  }
}

/**
 * AuditLedger - Manages the append-only audit blockchain
 * 
 * DESIGN PRINCIPLES:
 * - Append-only: Blocks can only be added, never removed or modified
 * - Hash-chained: Each block links to the previous via cryptographic hash
 * - Time-ordered: Blocks maintain strict chronological ordering
 * - Session-scoped: Audit trails are organized by exam session
 * - Tamper-evident: Any modification breaks the hash chain
 */
class AuditLedger {
  #chain;
  #sessionIndex;
  #isLocked;

  /**
   * Creates a new AuditLedger instance
   * 
   * @param {Object} options - Configuration options
   * @param {boolean} [options.createGenesis=true] - Whether to create genesis block
   */
  constructor(options = {}) {
    this.#chain = [];
    this.#sessionIndex = new Map(); // sessionId -> [blockIndices]
    this.#isLocked = false;

    const { createGenesis = true } = options;
    
    if (createGenesis) {
      this.#createGenesisBlock();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

  /** @returns {number} Total number of blocks in the ledger */
  get length() {
    return this.#chain.length;
  }

  /** @returns {LedgerBlock|null} The most recent block */
  get latestBlock() {
    return this.#chain.length > 0 ? this.#chain[this.#chain.length - 1] : null;
  }

  /** @returns {LedgerBlock|null} The genesis (first) block */
  get genesisBlock() {
    return this.#chain.length > 0 ? this.#chain[0] : null;
  }

  /** @returns {boolean} Whether the ledger is locked */
  get isLocked() {
    return this.#isLocked;
  }

  /** @returns {string[]} List of all session IDs in the ledger */
  get sessionIds() {
    return Array.from(this.#sessionIndex.keys());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPEND OPERATIONS (Write Path)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Appends a new audit event to the ledger
   * 
   * @param {Object} eventData - Event data to record
   * @param {string} eventData.sessionId - Exam session identifier
   * @param {string} eventData.eventType - Type of audit event
   * @param {string} [eventData.eventSummary] - Human-readable summary
   * @param {Object} [eventData.payload] - Structured event data
   * @param {Date} [eventData.timestamp] - Event timestamp
   * @returns {LedgerBlock} The newly created block
   * @throws {ImmutabilityViolationError} If ledger is locked
   */
  appendEvent(eventData) {
    if (this.#isLocked) {
      throw new ImmutabilityViolationError(
        'Cannot append to locked ledger. The ledger has been finalized.'
      );
    }

    const {
      sessionId,
      eventType,
      eventSummary,
      payload = {},
      timestamp = new Date()
    } = eventData;

    // Validate required fields
    if (!sessionId) {
      throw new Error('Session ID is required for audit events');
    }
    if (!eventType) {
      throw new Error('Event type is required for audit events');
    }

    // Create the new block
    const previousBlock = this.latestBlock;
    const block = new LedgerBlock({
      index: this.#chain.length,
      transactionId: uuidv4(),
      sessionId,
      eventType,
      eventSummary,
      payload: {
        ...payload,
        _prototype: true, // Mark as prototype data
        _source: 'simulation'
      },
      previousHash: previousBlock ? previousBlock.hash : '0',
      timestamp
    });

    // Append to chain
    this.#chain.push(block);

    // Update session index
    if (!this.#sessionIndex.has(sessionId)) {
      this.#sessionIndex.set(sessionId, []);
    }
    this.#sessionIndex.get(sessionId).push(block.index);

    return block;
  }

  /**
   * Records the start of an exam session
   * 
   * @param {string} sessionId - Unique session identifier
   * @param {Object} metadata - Session metadata
   * @returns {LedgerBlock} Created block
   */
  recordSessionStart(sessionId, metadata = {}) {
    return this.appendEvent({
      sessionId,
      eventType: EventType.SESSION_START,
      payload: {
        examId: metadata.examId,
        studentId: metadata.studentId,
        startTime: new Date().toISOString(),
        ...metadata
      }
    });
  }

  /**
   * Records the end of an exam session
   * 
   * @param {string} sessionId - Session identifier
   * @param {Object} metadata - Session end metadata
   * @returns {LedgerBlock} Created block
   */
  recordSessionEnd(sessionId, metadata = {}) {
    return this.appendEvent({
      sessionId,
      eventType: EventType.SESSION_END,
      payload: {
        endTime: new Date().toISOString(),
        duration: metadata.duration,
        finalScore: metadata.finalScore,
        finalCredibility: metadata.finalCredibility,
        totalViolations: metadata.totalViolations,
        ...metadata
      }
    });
  }

  /**
   * Records a face detection event
   * 
   * @param {string} sessionId - Session identifier
   * @param {string} eventType - Face event type
   * @param {Object} data - Detection data
   * @returns {LedgerBlock} Created block
   */
  recordFaceEvent(sessionId, eventType, data = {}) {
    return this.appendEvent({
      sessionId,
      eventType,
      payload: {
        confidence: data.confidence,
        faceCount: data.faceCount,
        boundingBox: data.boundingBox,
        frameNumber: data.frameNumber,
        ...data
      }
    });
  }

  /**
   * Records a behavior classification event
   * 
   * @param {string} sessionId - Session identifier
   * @param {string} classification - Behavior classification
   * @param {Object} data - Classification data
   * @returns {LedgerBlock} Created block
   */
  recordBehavior(sessionId, classification, data = {}) {
    const eventTypeMap = {
      'normal': EventType.BEHAVIOR_NORMAL,
      'suspicious': EventType.BEHAVIOR_SUSPICIOUS,
      'very_suspicious': EventType.BEHAVIOR_VERY_SUSPICIOUS
    };

    return this.appendEvent({
      sessionId,
      eventType: eventTypeMap[classification] || EventType.BEHAVIOR_NORMAL,
      payload: {
        classification,
        confidence: data.confidence,
        indicators: data.indicators,
        aiModel: data.aiModel,
        ...data
      }
    });
  }

  /**
   * Records a credibility score update
   * 
   * @param {string} sessionId - Session identifier
   * @param {number} score - New credibility score
   * @param {Object} data - Score calculation data
   * @returns {LedgerBlock} Created block
   */
  recordCredibilityUpdate(sessionId, score, data = {}) {
    const isThresholdBreach = score < (data.threshold || 50);
    
    return this.appendEvent({
      sessionId,
      eventType: isThresholdBreach 
        ? EventType.CREDIBILITY_THRESHOLD_BREACH 
        : EventType.CREDIBILITY_UPDATE,
      payload: {
        score,
        previousScore: data.previousScore,
        delta: data.delta,
        threshold: data.threshold || 50,
        reason: data.reason,
        ...data
      }
    });
  }

  /**
   * Records a security event (tab switch, copy, etc.)
   * 
   * @param {string} sessionId - Session identifier
   * @param {string} eventType - Security event type
   * @param {Object} data - Event data
   * @returns {LedgerBlock} Created block
   */
  recordSecurityEvent(sessionId, eventType, data = {}) {
    return this.appendEvent({
      sessionId,
      eventType,
      payload: {
        timestamp: new Date().toISOString(),
        ...data
      }
    });
  }

  /**
   * Locks the ledger to prevent further modifications
   * Once locked, the ledger becomes truly immutable.
   */
  lock() {
    this.#isLocked = true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY OPERATIONS (Read Path)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gets a block by its index
   * 
   * @param {number} index - Block index
   * @returns {LedgerBlock|null} The block or null if not found
   */
  getBlock(index) {
    if (index < 0 || index >= this.#chain.length) {
      return null;
    }
    return this.#chain[index];
  }

  /**
   * Gets a block by its hash
   * 
   * @param {string} hash - Block hash
   * @returns {LedgerBlock|null} The block or null if not found
   */
  getBlockByHash(hash) {
    return this.#chain.find(block => block.hash === hash) || null;
  }

  /**
   * Gets a block by transaction ID
   * 
   * @param {string} transactionId - Transaction identifier
   * @returns {LedgerBlock|null} The block or null if not found
   */
  getBlockByTransactionId(transactionId) {
    return this.#chain.find(block => block.transactionId === transactionId) || null;
  }

  /**
   * Gets all blocks for a specific session
   * 
   * @param {string} sessionId - Session identifier
   * @returns {LedgerBlock[]} Array of blocks for the session
   */
  getSessionBlocks(sessionId) {
    const indices = this.#sessionIndex.get(sessionId) || [];
    return indices.map(idx => this.#chain[idx]);
  }

  /**
   * Gets complete audit trail for a session
   * 
   * @param {string} sessionId - Session identifier
   * @returns {Object} Audit trail with metadata and blocks
   */
  getSessionAuditTrail(sessionId) {
    const blocks = this.getSessionBlocks(sessionId);
    
    if (blocks.length === 0) {
      return null;
    }

    const violations = blocks.filter(b => b.getSeverity() === EventSeverity.VIOLATION);
    const warnings = blocks.filter(b => b.getSeverity() === EventSeverity.WARNING);

    return {
      sessionId,
      blockCount: blocks.length,
      startTime: blocks[0]?.timestamp,
      endTime: blocks[blocks.length - 1]?.timestamp,
      violations: violations.length,
      warnings: warnings.length,
      integrityValid: this.verifySessionIntegrity(sessionId),
      blocks: blocks.map(b => b.toJSON()),
      timeline: this.#generateTimeline(blocks)
    };
  }

  /**
   * Filters blocks by event type
   * 
   * @param {string|string[]} eventTypes - Event type(s) to filter
   * @returns {LedgerBlock[]} Filtered blocks
   */
  filterByEventType(eventTypes) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    return this.#chain.filter(block => types.includes(block.eventType));
  }

  /**
   * Gets only violation events
   * 
   * @returns {LedgerBlock[]} Violation blocks
   */
  getViolations() {
    return this.#chain.filter(block => block.getSeverity() === EventSeverity.VIOLATION);
  }

  /**
   * Gets blocks within a time range
   * 
   * @param {Date} startTime - Start of range
   * @param {Date} endTime - End of range
   * @returns {LedgerBlock[]} Blocks in range
   */
  getBlocksInTimeRange(startTime, endTime) {
    return this.#chain.filter(block => {
      const timestamp = block.timestamp;
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  /**
   * Returns the complete chain as JSON
   * 
   * @returns {Object[]} Array of block JSON objects
   */
  toJSON() {
    return this.#chain.map(block => block.toJSON());
  }

  /**
   * Returns ledger statistics
   * 
   * @returns {Object} Statistics object
   */
  getStatistics() {
    const eventCounts = {};
    const severityCounts = {
      [EventSeverity.INFO]: 0,
      [EventSeverity.WARNING]: 0,
      [EventSeverity.CRITICAL]: 0,
      [EventSeverity.VIOLATION]: 0
    };

    for (const block of this.#chain) {
      eventCounts[block.eventType] = (eventCounts[block.eventType] || 0) + 1;
      severityCounts[block.getSeverity()]++;
    }

    return {
      totalBlocks: this.#chain.length,
      totalSessions: this.#sessionIndex.size,
      eventCounts,
      severityCounts,
      firstBlockTime: this.genesisBlock?.timestamp,
      lastBlockTime: this.latestBlock?.timestamp,
      isLocked: this.#isLocked,
      integrityValid: this.verifyIntegrity()
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRITY VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifies the integrity of the entire ledger
   * 
   * @returns {Object} Verification result
   */
  verifyIntegrity() {
    const result = {
      valid: true,
      totalBlocks: this.#chain.length,
      invalidBlocks: [],
      brokenLinks: [],
      checkedAt: new Date().toISOString()
    };

    for (let i = 0; i < this.#chain.length; i++) {
      const block = this.#chain[i];
      const previousBlock = i > 0 ? this.#chain[i - 1] : null;

      // Verify block's own hash
      if (!block.validateHash()) {
        result.valid = false;
        result.invalidBlocks.push({
          index: i,
          transactionId: block.transactionId,
          reason: 'Hash mismatch - block data may have been tampered'
        });
      }

      // Verify chain link
      if (!block.validateChainLink(previousBlock)) {
        result.valid = false;
        result.brokenLinks.push({
          index: i,
          expectedPreviousHash: previousBlock?.hash || '0',
          actualPreviousHash: block.previousHash,
          reason: 'Chain link broken - previous hash does not match'
        });
      }
    }

    return result;
  }

  /**
   * Verifies integrity of a specific session's blocks
   * 
   * @param {string} sessionId - Session to verify
   * @returns {boolean} True if session blocks are valid
   */
  verifySessionIntegrity(sessionId) {
    const indices = this.#sessionIndex.get(sessionId) || [];
    
    for (const idx of indices) {
      const block = this.#chain[idx];
      if (!block.validateHash()) {
        return false;
      }
    }

    return true;
  }

  /**
   * Detects tampering by comparing with a reference chain
   * 
   * @param {Object[]} referenceChain - Reference chain to compare against
   * @returns {Object} Tampering detection result
   */
  detectTampering(referenceChain) {
    const result = {
      tampered: false,
      differences: []
    };

    const minLength = Math.min(this.#chain.length, referenceChain.length);

    for (let i = 0; i < minLength; i++) {
      const currentBlock = this.#chain[i];
      const referenceBlock = referenceChain[i];

      if (currentBlock.hash !== referenceBlock.hash) {
        result.tampered = true;
        result.differences.push({
          index: i,
          currentHash: currentBlock.hash,
          referenceHash: referenceBlock.hash
        });
      }
    }

    if (this.#chain.length !== referenceChain.length) {
      result.tampered = true;
      result.differences.push({
        type: 'length_mismatch',
        current: this.#chain.length,
        reference: referenceChain.length
      });
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION & PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Exports the ledger for backup/transfer
   * 
   * @returns {Object} Exportable ledger data
   */
  export() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      isLocked: this.#isLocked,
      chain: this.toJSON(),
      sessions: Array.from(this.#sessionIndex.entries()),
      statistics: this.getStatistics(),
      _prototype: true,
      _warning: 'PROTOTYPE DATA - NOT FROM PRODUCTION SYSTEM'
    };
  }

  /**
   * Imports a ledger from exported data
   * 
   * @param {Object} data - Exported ledger data
   * @returns {AuditLedger} New ledger instance
   */
  static import(data) {
    const ledger = new AuditLedger({ createGenesis: false });

    // Reconstruct chain
    for (const blockData of data.chain) {
      const block = LedgerBlock.fromJSON(blockData);
      ledger.#chain.push(block);
    }

    // Reconstruct session index
    for (const [sessionId, indices] of data.sessions) {
      ledger.#sessionIndex.set(sessionId, indices);
    }

    if (data.isLocked) {
      ledger.lock();
    }

    // Verify integrity after import
    const integrity = ledger.verifyIntegrity();
    if (!integrity.valid) {
      throw new IntegrityViolationError(
        'Imported ledger failed integrity verification',
        integrity
      );
    }

    return ledger;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates the genesis (first) block
   * @private
   */
  #createGenesisBlock() {
    const genesisBlock = new LedgerBlock({
      index: 0,
      transactionId: 'genesis-' + uuidv4(),
      sessionId: 'SYSTEM',
      eventType: 'GENESIS',
      eventSummary: 'Audit Ledger Genesis Block - Prototype Initialized',
      payload: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        _prototype: true,
        _warning: 'PROTOTYPE - NOT PRODUCTION DATA'
      },
      previousHash: '0'
    });

    this.#chain.push(genesisBlock);
    this.#sessionIndex.set('SYSTEM', [0]);
  }

  /**
   * Generates a timeline view of blocks
   * @private
   * @param {LedgerBlock[]} blocks - Blocks to process
   * @returns {Object[]} Timeline entries
   */
  #generateTimeline(blocks) {
    return blocks.map(block => ({
      time: block.timestampISO,
      type: block.eventType,
      severity: block.getSeverity(),
      summary: block.eventSummary,
      hash: block.hash.substring(0, 16) + '...'
    }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  AuditLedger,
  ImmutabilityViolationError,
  IntegrityViolationError
};
