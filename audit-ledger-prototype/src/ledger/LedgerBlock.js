/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOTYPE: LedgerBlock - Immutable Blockchain-Style Audit Block
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  WARNING: THIS IS A PROTOTYPE IMPLEMENTATION
 * ⚠️  NOT CONNECTED TO PRODUCTION SYSTEMS
 * ⚠️  FOR DEMONSTRATION AND ARCHITECTURAL VALIDATION ONLY
 * 
 * This class represents a single immutable block in the audit ledger.
 * Each block contains:
 *   - Audit event data
 *   - Cryptographic hash linking to previous block
 *   - Timestamp for chronological ordering
 *   - Integrity verification capabilities
 * 
 * FUTURE REPLACEMENT POINT:
 * This class can be replaced with a real blockchain SDK block structure
 * (e.g., Hyperledger Fabric, Ethereum, or custom blockchain implementation)
 * while maintaining the same interface.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

/**
 * Event severity levels for audit classification
 */
const EventSeverity = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  VIOLATION: 'violation'
});

/**
 * Supported event types in the proctoring audit system
 */
const EventType = Object.freeze({
  // Session Lifecycle
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  SESSION_PAUSE: 'session_pause',
  SESSION_RESUME: 'session_resume',
  
  // Face Detection Events
  FACE_DETECTED: 'face_detected',
  FACE_LOST: 'face_lost',
  MULTIPLE_FACES: 'multiple_faces',
  NO_FACE: 'no_face',
  
  // Behavior Classification
  BEHAVIOR_NORMAL: 'behavior_normal',
  BEHAVIOR_SUSPICIOUS: 'behavior_suspicious',
  BEHAVIOR_VERY_SUSPICIOUS: 'behavior_very_suspicious',
  
  // Credibility Score Events
  CREDIBILITY_UPDATE: 'credibility_update',
  CREDIBILITY_THRESHOLD_BREACH: 'credibility_threshold_breach',
  
  // Exam Events
  QUESTION_VIEWED: 'question_viewed',
  ANSWER_SUBMITTED: 'answer_submitted',
  EXAM_SUBMITTED: 'exam_submitted',
  
  // Security Events
  TAB_SWITCH: 'tab_switch',
  WINDOW_BLUR: 'window_blur',
  COPY_ATTEMPT: 'copy_attempt',
  PASTE_ATTEMPT: 'paste_attempt',
  RIGHT_CLICK: 'right_click',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  
  // System Events
  SYSTEM_WARNING: 'system_warning',
  INTEGRITY_CHECK: 'integrity_check'
});

/**
 * LedgerBlock - Represents a single immutable block in the audit chain
 * 
 * Once created, a block CANNOT be modified. Any attempt to mutate
 * properties will throw an ImmutabilityViolationError.
 */
class LedgerBlock {
  #index;
  #transactionId;
  #sessionId;
  #eventType;
  #eventSummary;
  #payload;
  #timestamp;
  #previousHash;
  #hash;
  #frozen;

  /**
   * Creates a new immutable ledger block
   * 
   * @param {Object} params - Block parameters
   * @param {number} params.index - Sequential block number (0-indexed)
   * @param {string} params.transactionId - Unique transaction identifier
   * @param {string} params.sessionId - Exam session identifier
   * @param {string} params.eventType - Type of audit event
   * @param {string} params.eventSummary - Human-readable event description
   * @param {Object} params.payload - Structured event data
   * @param {string} params.previousHash - Hash of the previous block
   * @param {Date} [params.timestamp] - Event timestamp (defaults to now)
   */
  constructor({
    index,
    transactionId,
    sessionId,
    eventType,
    eventSummary,
    payload,
    previousHash,
    timestamp = new Date()
  }) {
    // Validate required fields
    if (typeof index !== 'number' || index < 0) {
      throw new Error('Block index must be a non-negative number');
    }
    if (!transactionId || typeof transactionId !== 'string') {
      throw new Error('Transaction ID is required');
    }
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Session ID is required');
    }
    if (!eventType || typeof eventType !== 'string') {
      throw new Error('Event type is required');
    }
    if (typeof previousHash !== 'string') {
      throw new Error('Previous hash is required (use "0" for genesis block)');
    }

    // Initialize private fields
    this.#index = index;
    this.#transactionId = transactionId;
    this.#sessionId = sessionId;
    this.#eventType = eventType;
    this.#eventSummary = eventSummary || this.#generateSummary(eventType, payload);
    this.#payload = Object.freeze(this.#deepClone(payload || {}));
    this.#timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.#previousHash = previousHash;
    this.#hash = this.#calculateHash();
    this.#frozen = true;

    // Freeze the instance to prevent modifications
    Object.freeze(this);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS (Read-only access to block properties)
  // ═══════════════════════════════════════════════════════════════════════════

  /** @returns {number} Block index in the chain */
  get index() { return this.#index; }

  /** @returns {string} Unique transaction identifier */
  get transactionId() { return this.#transactionId; }

  /** @returns {string} Associated exam session ID */
  get sessionId() { return this.#sessionId; }

  /** @returns {string} Type of audit event */
  get eventType() { return this.#eventType; }

  /** @returns {string} Human-readable event summary */
  get eventSummary() { return this.#eventSummary; }

  /** @returns {Object} Frozen copy of event payload */
  get payload() { return this.#deepClone(this.#payload); }

  /** @returns {Date} UTC timestamp of event */
  get timestamp() { return new Date(this.#timestamp); }

  /** @returns {string} ISO timestamp string */
  get timestampISO() { return this.#timestamp.toISOString(); }

  /** @returns {string} Hash of previous block */
  get previousHash() { return this.#previousHash; }

  /** @returns {string} Current block hash */
  get hash() { return this.#hash; }

  /** @returns {boolean} Whether block is frozen/immutable */
  get isFrozen() { return this.#frozen; }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validates the block's hash integrity
   * @returns {boolean} True if hash is valid
   */
  validateHash() {
    return this.#hash === this.#calculateHash();
  }

  /**
   * Checks if this block correctly links to the provided previous block
   * @param {LedgerBlock} previousBlock - The expected previous block
   * @returns {boolean} True if chain link is valid
   */
  validateChainLink(previousBlock) {
    if (!previousBlock) {
      // Genesis block validation
      return this.#index === 0 && this.#previousHash === '0';
    }
    return (
      this.#previousHash === previousBlock.hash &&
      this.#index === previousBlock.index + 1
    );
  }

  /**
   * Returns event severity based on event type
   * @returns {string} Severity level
   */
  getSeverity() {
    const violationEvents = [
      EventType.MULTIPLE_FACES,
      EventType.BEHAVIOR_VERY_SUSPICIOUS,
      EventType.CREDIBILITY_THRESHOLD_BREACH
    ];
    const warningEvents = [
      EventType.FACE_LOST,
      EventType.NO_FACE,
      EventType.BEHAVIOR_SUSPICIOUS,
      EventType.TAB_SWITCH,
      EventType.WINDOW_BLUR,
      EventType.COPY_ATTEMPT,
      EventType.PASTE_ATTEMPT
    ];
    const criticalEvents = [
      EventType.SESSION_END
    ];

    if (violationEvents.includes(this.#eventType)) return EventSeverity.VIOLATION;
    if (criticalEvents.includes(this.#eventType)) return EventSeverity.CRITICAL;
    if (warningEvents.includes(this.#eventType)) return EventSeverity.WARNING;
    return EventSeverity.INFO;
  }

  /**
   * Converts block to a plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      index: this.#index,
      transactionId: this.#transactionId,
      sessionId: this.#sessionId,
      eventType: this.#eventType,
      eventSummary: this.#eventSummary,
      payload: this.#deepClone(this.#payload),
      timestamp: this.#timestamp.toISOString(),
      previousHash: this.#previousHash,
      hash: this.#hash,
      severity: this.getSeverity(),
      hashValid: this.validateHash()
    };
  }

  /**
   * Creates a block from JSON data (for deserialization)
   * @param {Object} json - JSON block data
   * @returns {LedgerBlock} Reconstructed block
   */
  static fromJSON(json) {
    const block = new LedgerBlock({
      index: json.index,
      transactionId: json.transactionId,
      sessionId: json.sessionId,
      eventType: json.eventType,
      eventSummary: json.eventSummary,
      payload: json.payload,
      previousHash: json.previousHash,
      timestamp: new Date(json.timestamp)
    });

    // Verify hash matches
    if (block.hash !== json.hash) {
      throw new Error(
        `Hash mismatch during deserialization. Expected: ${json.hash}, Got: ${block.hash}`
      );
    }

    return block;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculates SHA-256 hash of block contents
   * @private
   * @returns {string} Hexadecimal hash string
   */
  #calculateHash() {
    const data = JSON.stringify({
      index: this.#index,
      transactionId: this.#transactionId,
      sessionId: this.#sessionId,
      eventType: this.#eventType,
      eventSummary: this.#eventSummary,
      payload: this.#payload,
      timestamp: this.#timestamp.toISOString(),
      previousHash: this.#previousHash
    });

    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Deep clones an object to ensure immutability
   * @private
   * @param {Object} obj - Object to clone
   * @returns {Object} Deep clone
   */
  #deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => this.#deepClone(item));
    
    const clone = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = this.#deepClone(obj[key]);
      }
    }
    return clone;
  }

  /**
   * Generates default summary based on event type
   * @private
   * @param {string} eventType - Event type
   * @param {Object} payload - Event payload
   * @returns {string} Generated summary
   */
  #generateSummary(eventType, payload) {
    const summaries = {
      [EventType.SESSION_START]: 'Exam session started',
      [EventType.SESSION_END]: 'Exam session ended',
      [EventType.SESSION_PAUSE]: 'Exam session paused',
      [EventType.SESSION_RESUME]: 'Exam session resumed',
      [EventType.FACE_DETECTED]: 'Face detected in frame',
      [EventType.FACE_LOST]: 'Face lost from frame',
      [EventType.MULTIPLE_FACES]: 'Multiple faces detected - potential violation',
      [EventType.NO_FACE]: 'No face detected in frame',
      [EventType.BEHAVIOR_NORMAL]: 'Normal behavior observed',
      [EventType.BEHAVIOR_SUSPICIOUS]: 'Suspicious behavior detected',
      [EventType.BEHAVIOR_VERY_SUSPICIOUS]: 'Very suspicious behavior detected',
      [EventType.CREDIBILITY_UPDATE]: `Credibility score updated to ${payload?.score || 'N/A'}`,
      [EventType.CREDIBILITY_THRESHOLD_BREACH]: 'Credibility score below threshold',
      [EventType.QUESTION_VIEWED]: `Question ${payload?.questionNumber || 'N/A'} viewed`,
      [EventType.ANSWER_SUBMITTED]: `Answer submitted for question ${payload?.questionNumber || 'N/A'}`,
      [EventType.EXAM_SUBMITTED]: 'Exam submitted',
      [EventType.TAB_SWITCH]: 'Tab switch detected',
      [EventType.WINDOW_BLUR]: 'Window lost focus',
      [EventType.COPY_ATTEMPT]: 'Copy attempt blocked',
      [EventType.PASTE_ATTEMPT]: 'Paste attempt blocked',
      [EventType.RIGHT_CLICK]: 'Right-click attempt blocked',
      [EventType.KEYBOARD_SHORTCUT]: 'Keyboard shortcut blocked',
      [EventType.SYSTEM_WARNING]: payload?.message || 'System warning',
      [EventType.INTEGRITY_CHECK]: 'Integrity verification performed'
    };

    return summaries[eventType] || `Event: ${eventType}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  LedgerBlock,
  EventType,
  EventSeverity
};
