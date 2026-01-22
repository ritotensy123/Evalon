/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROTOTYPE: Simulated Event Generator for Audit Ledger Demonstration
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ⚠️  WARNING: THIS IS A PROTOTYPE IMPLEMENTATION
 * ⚠️  ALL DATA IS SIMULATED - NOT FROM PRODUCTION SYSTEMS
 * ⚠️  FOR DEMONSTRATION AND ARCHITECTURAL VALIDATION ONLY
 * 
 * This module generates realistic-looking exam proctoring events to
 * demonstrate the audit ledger's capabilities. Events mimic what a
 * real AI proctoring system would produce.
 * 
 * SIMULATED SCENARIOS:
 * - Normal exam sessions with minor behavior variations
 * - Sessions with suspicious activity patterns
 * - Sessions with clear violations
 * - Edge cases for integrity testing
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { v4: uuidv4 } = require('uuid');
const { EventType } = require('../ledger');

/**
 * Generates simulated student data
 */
function generateStudent() {
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  return {
    id: 'STU-' + uuidv4().substring(0, 8).toUpperCase(),
    firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
    email: `student${Math.floor(Math.random() * 9999)}@demo.evalon.edu`
  };
}

/**
 * Generates simulated exam data
 */
function generateExam() {
  const subjects = [
    'Introduction to Computer Science',
    'Data Structures & Algorithms',
    'Database Management Systems',
    'Software Engineering',
    'Machine Learning Fundamentals',
    'Operating Systems',
    'Computer Networks',
    'Discrete Mathematics'
  ];

  return {
    id: 'EXAM-' + uuidv4().substring(0, 8).toUpperCase(),
    title: subjects[Math.floor(Math.random() * subjects.length)],
    duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
    totalQuestions: Math.floor(Math.random() * 30) + 20,
    passingScore: 60
  };
}

/**
 * Generates a timestamp offset from base time
 * @param {Date} baseTime - Base timestamp
 * @param {number} offsetSeconds - Seconds to add
 * @returns {Date} New timestamp
 */
function offsetTime(baseTime, offsetSeconds) {
  return new Date(baseTime.getTime() + offsetSeconds * 1000);
}

/**
 * Generates a random value within a range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value
 */
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a single simulated event
 * @param {string} sessionId - Session ID
 * @param {string} eventType - Event type
 * @param {Date} timestamp - Event timestamp
 * @param {Object} payload - Event payload
 * @returns {Object} Simulated event
 */
function createEvent(sessionId, eventType, timestamp, payload = {}) {
  return {
    sessionId,
    eventType,
    timestamp,
    payload: {
      _simulated: true,
      _generatedAt: new Date().toISOString(),
      ...payload
    }
  };
}

/**
 * EventScenario - Base class for different exam scenarios
 */
class EventScenario {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.sessionId = 'SES-' + uuidv4().substring(0, 12).toUpperCase();
    this.student = generateStudent();
    this.exam = generateExam();
    this.baseTime = new Date();
    this.events = [];
  }

  /**
   * Generates all events for this scenario
   * @returns {Object[]} Array of events
   */
  generate() {
    throw new Error('Subclasses must implement generate()');
  }
}

/**
 * NormalExamScenario - A typical exam session with no issues
 */
class NormalExamScenario extends EventScenario {
  constructor() {
    super('normal', 'Normal exam session with minor behavior variations');
  }

  generate() {
    const events = [];
    let timeOffset = 0;
    let credibilityScore = 100;

    // Session Start
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_START,
      offsetTime(this.baseTime, timeOffset),
      {
        examId: this.exam.id,
        examTitle: this.exam.title,
        studentId: this.student.id,
        studentName: `${this.student.firstName} ${this.student.lastName}`,
        duration: this.exam.duration,
        totalQuestions: this.exam.totalQuestions
      }
    ));
    timeOffset += 2;

    // Initial face detection
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      {
        confidence: 0.98,
        faceCount: 1,
        boundingBox: { x: 120, y: 80, width: 200, height: 250 }
      }
    ));
    timeOffset += 3;

    // Initial behavior check
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_NORMAL,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'normal',
        confidence: 0.95,
        indicators: ['stable_gaze', 'relaxed_posture']
      }
    ));
    timeOffset += 5;

    // Simulate answering questions
    for (let q = 1; q <= Math.min(this.exam.totalQuestions, 10); q++) {
      // View question
      events.push(createEvent(
        this.sessionId,
        EventType.QUESTION_VIEWED,
        offsetTime(this.baseTime, timeOffset),
        { questionNumber: q, questionId: `Q-${q}` }
      ));
      timeOffset += randomInRange(20, 60);

      // Occasional face/behavior checks
      if (q % 3 === 0) {
        events.push(createEvent(
          this.sessionId,
          EventType.FACE_DETECTED,
          offsetTime(this.baseTime, timeOffset),
          { confidence: randomInRange(0.92, 0.99), faceCount: 1 }
        ));
        timeOffset += 1;

        events.push(createEvent(
          this.sessionId,
          EventType.BEHAVIOR_NORMAL,
          offsetTime(this.baseTime, timeOffset),
          {
            classification: 'normal',
            confidence: randomInRange(0.88, 0.98)
          }
        ));
        timeOffset += 2;
      }

      // Submit answer
      events.push(createEvent(
        this.sessionId,
        EventType.ANSWER_SUBMITTED,
        offsetTime(this.baseTime, timeOffset),
        {
          questionNumber: q,
          questionId: `Q-${q}`,
          answerLength: Math.floor(randomInRange(50, 500))
        }
      ));
      timeOffset += 5;
    }

    // Credibility update (remains high)
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: 100,
        delta: 0,
        threshold: 50
      }
    ));
    timeOffset += 10;

    // Exam submission
    events.push(createEvent(
      this.sessionId,
      EventType.EXAM_SUBMITTED,
      offsetTime(this.baseTime, timeOffset),
      {
        totalAnswered: Math.min(this.exam.totalQuestions, 10),
        totalQuestions: this.exam.totalQuestions,
        timeSpent: timeOffset
      }
    ));
    timeOffset += 2;

    // Session End
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_END,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: timeOffset,
        finalCredibility: credibilityScore,
        totalViolations: 0,
        status: 'completed_normally'
      }
    ));

    return events;
  }
}

/**
 * SuspiciousActivityScenario - Session with suspicious behavior patterns
 */
class SuspiciousActivityScenario extends EventScenario {
  constructor() {
    super('suspicious', 'Session with suspicious behavior patterns detected');
  }

  generate() {
    const events = [];
    let timeOffset = 0;
    let credibilityScore = 100;

    // Session Start
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_START,
      offsetTime(this.baseTime, timeOffset),
      {
        examId: this.exam.id,
        examTitle: this.exam.title,
        studentId: this.student.id,
        studentName: `${this.student.firstName} ${this.student.lastName}`
      }
    ));
    timeOffset += 2;

    // Initial face detection
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      { confidence: 0.97, faceCount: 1 }
    ));
    timeOffset += 30;

    // First suspicious behavior - looking away
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_SUSPICIOUS,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'suspicious',
        confidence: 0.72,
        indicators: ['gaze_deviation', 'head_turn'],
        description: 'Student looking away from screen repeatedly'
      }
    ));
    credibilityScore -= 5;
    timeOffset += 10;

    // Credibility drop
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: 100,
        delta: -5,
        reason: 'suspicious_behavior'
      }
    ));
    timeOffset += 45;

    // Tab switch attempt
    events.push(createEvent(
      this.sessionId,
      EventType.TAB_SWITCH,
      offsetTime(this.baseTime, timeOffset),
      {
        previousUrl: 'exam.evalon.edu/session',
        attemptBlocked: true,
        duration: 0.5
      }
    ));
    credibilityScore -= 10;
    timeOffset += 5;

    // Credibility drop
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: credibilityScore + 10,
        delta: -10,
        reason: 'tab_switch_attempt'
      }
    ));
    timeOffset += 60;

    // Window blur (focus lost)
    events.push(createEvent(
      this.sessionId,
      EventType.WINDOW_BLUR,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: 2.3,
        recovered: true
      }
    ));
    credibilityScore -= 8;
    timeOffset += 10;

    // More suspicious behavior
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_SUSPICIOUS,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'suspicious',
        confidence: 0.78,
        indicators: ['frequent_movements', 'talking_detected']
      }
    ));
    credibilityScore -= 5;
    timeOffset += 20;

    // Credibility update
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: credibilityScore + 13,
        delta: -13,
        threshold: 50
      }
    ));
    timeOffset += 300;

    // Behavior returns to normal
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_NORMAL,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'normal',
        confidence: 0.91,
        note: 'Behavior stabilized'
      }
    ));
    timeOffset += 200;

    // Exam submission
    events.push(createEvent(
      this.sessionId,
      EventType.EXAM_SUBMITTED,
      offsetTime(this.baseTime, timeOffset),
      { totalAnswered: 18, totalQuestions: 25 }
    ));
    timeOffset += 2;

    // Session End
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_END,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: timeOffset,
        finalCredibility: credibilityScore,
        totalViolations: 0,
        warnings: 4,
        status: 'completed_with_warnings'
      }
    ));

    return events;
  }
}

/**
 * ViolationScenario - Session with clear violations
 */
class ViolationScenario extends EventScenario {
  constructor() {
    super('violation', 'Session with clear integrity violations');
  }

  generate() {
    const events = [];
    let timeOffset = 0;
    let credibilityScore = 100;

    // Session Start
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_START,
      offsetTime(this.baseTime, timeOffset),
      {
        examId: this.exam.id,
        examTitle: this.exam.title,
        studentId: this.student.id,
        studentName: `${this.student.firstName} ${this.student.lastName}`
      }
    ));
    timeOffset += 2;

    // Initial face detection
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      { confidence: 0.95, faceCount: 1 }
    ));
    timeOffset += 60;

    // VIOLATION: Multiple faces detected
    events.push(createEvent(
      this.sessionId,
      EventType.MULTIPLE_FACES,
      offsetTime(this.baseTime, timeOffset),
      {
        faceCount: 2,
        confidence: 0.89,
        description: 'Second person detected in frame',
        screenshot: 'violation_screenshot_001.jpg'
      }
    ));
    credibilityScore -= 30;
    timeOffset += 5;

    // Immediate credibility drop
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: 100,
        delta: -30,
        reason: 'multiple_faces_violation'
      }
    ));
    timeOffset += 30;

    // Very suspicious behavior
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_VERY_SUSPICIOUS,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'very_suspicious',
        confidence: 0.94,
        indicators: ['looking_at_external_device', 'whispering_detected', 'abnormal_posture']
      }
    ));
    credibilityScore -= 20;
    timeOffset += 10;

    // Credibility threshold breach
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_THRESHOLD_BREACH,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        threshold: 50,
        breachSeverity: 'warning'
      }
    ));
    timeOffset += 20;

    // Copy attempt
    events.push(createEvent(
      this.sessionId,
      EventType.COPY_ATTEMPT,
      offsetTime(this.baseTime, timeOffset),
      {
        blocked: true,
        selectedText: '[REDACTED]',
        keyCombo: 'Ctrl+C'
      }
    ));
    credibilityScore -= 15;
    timeOffset += 45;

    // Face lost
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_LOST,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: 8.5,
        lastKnownPosition: { x: 150, y: 100 }
      }
    ));
    credibilityScore -= 10;
    timeOffset += 10;

    // Critical credibility
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        previousScore: credibilityScore + 45,
        delta: -45,
        threshold: 50,
        status: 'critical'
      }
    ));
    timeOffset += 60;

    // Session paused by system
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_PAUSE,
      offsetTime(this.baseTime, timeOffset),
      {
        reason: 'integrity_review_required',
        pausedBy: 'system',
        credibilityAtPause: credibilityScore
      }
    ));
    timeOffset += 300;

    // Session ended by proctor
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_END,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: timeOffset,
        finalCredibility: credibilityScore,
        totalViolations: 3,
        status: 'terminated_for_violations',
        terminatedBy: 'proctor',
        reviewRequired: true
      }
    ));

    return events;
  }
}

/**
 * IntermittentIssuesScenario - Session with technical/connectivity issues
 */
class IntermittentIssuesScenario extends EventScenario {
  constructor() {
    super('intermittent', 'Session with intermittent technical issues');
  }

  generate() {
    const events = [];
    let timeOffset = 0;
    let credibilityScore = 100;

    // Session Start
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_START,
      offsetTime(this.baseTime, timeOffset),
      {
        examId: this.exam.id,
        studentId: this.student.id,
        studentName: `${this.student.firstName} ${this.student.lastName}`
      }
    ));
    timeOffset += 2;

    // Face detection works
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      { confidence: 0.96, faceCount: 1 }
    ));
    timeOffset += 120;

    // Face lost due to camera issue
    events.push(createEvent(
      this.sessionId,
      EventType.NO_FACE,
      offsetTime(this.baseTime, timeOffset),
      {
        reason: 'camera_obstruction',
        duration: 3.2,
        possibleCause: 'lighting_change'
      }
    ));
    credibilityScore -= 3;
    timeOffset += 5;

    // Face recovered
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      { confidence: 0.88, faceCount: 1, note: 'recovered_after_brief_loss' }
    ));
    timeOffset += 180;

    // Another brief face loss
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_LOST,
      offsetTime(this.baseTime, timeOffset),
      { duration: 1.5, reason: 'quick_movement' }
    ));
    timeOffset += 3;

    // Recovered
    events.push(createEvent(
      this.sessionId,
      EventType.FACE_DETECTED,
      offsetTime(this.baseTime, timeOffset),
      { confidence: 0.92, faceCount: 1 }
    ));
    timeOffset += 300;

    // Minor suspicious activity (acceptable)
    events.push(createEvent(
      this.sessionId,
      EventType.BEHAVIOR_SUSPICIOUS,
      offsetTime(this.baseTime, timeOffset),
      {
        classification: 'suspicious',
        confidence: 0.55, // Low confidence - likely false positive
        indicators: ['brief_distraction'],
        note: 'Low confidence detection - likely acceptable'
      }
    ));
    credibilityScore -= 2;
    timeOffset += 400;

    // Exam completion
    events.push(createEvent(
      this.sessionId,
      EventType.EXAM_SUBMITTED,
      offsetTime(this.baseTime, timeOffset),
      { totalAnswered: 25, totalQuestions: 25 }
    ));
    timeOffset += 2;

    // Credibility final
    events.push(createEvent(
      this.sessionId,
      EventType.CREDIBILITY_UPDATE,
      offsetTime(this.baseTime, timeOffset),
      {
        score: credibilityScore,
        threshold: 50,
        status: 'acceptable'
      }
    ));
    timeOffset += 2;

    // Session End
    events.push(createEvent(
      this.sessionId,
      EventType.SESSION_END,
      offsetTime(this.baseTime, timeOffset),
      {
        duration: timeOffset,
        finalCredibility: credibilityScore,
        totalViolations: 0,
        technicalIssues: 2,
        status: 'completed_with_minor_issues'
      }
    ));

    return events;
  }
}

/**
 * EventGenerator - Main class to generate simulated events
 */
class EventGenerator {
  /**
   * Generates events for a specific scenario
   * @param {string} scenarioType - Scenario type
   * @returns {Object} Scenario info and events
   */
  static generateScenario(scenarioType = 'normal') {
    const scenarios = {
      normal: NormalExamScenario,
      suspicious: SuspiciousActivityScenario,
      violation: ViolationScenario,
      intermittent: IntermittentIssuesScenario
    };

    const ScenarioClass = scenarios[scenarioType] || NormalExamScenario;
    const scenario = new ScenarioClass();
    const events = scenario.generate();

    return {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        sessionId: scenario.sessionId,
        student: scenario.student,
        exam: scenario.exam
      },
      events,
      _prototype: true,
      _warning: 'SIMULATED DATA - NOT FROM PRODUCTION'
    };
  }

  /**
   * Generates a mix of scenarios for demonstration
   * @param {number} count - Number of scenarios to generate
   * @returns {Object[]} Array of scenario data
   */
  static generateDemoSet(count = 5) {
    const types = ['normal', 'normal', 'suspicious', 'violation', 'intermittent'];
    const scenarios = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      scenarios.push(this.generateScenario(type));
    }

    return scenarios;
  }

  /**
   * Populates an AuditLedger with demo data
   * @param {AuditLedger} ledger - Ledger to populate
   * @param {number} scenarioCount - Number of scenarios
   * @returns {Object} Population summary
   */
  static populateLedger(ledger, scenarioCount = 5) {
    const scenarios = this.generateDemoSet(scenarioCount);
    let totalEvents = 0;

    for (const { events } of scenarios) {
      for (const event of events) {
        ledger.appendEvent(event);
        totalEvents++;
      }
    }

    return {
      scenariosGenerated: scenarios.length,
      totalEvents,
      sessions: scenarios.map(s => ({
        sessionId: s.scenario.sessionId,
        type: s.scenario.name,
        student: s.scenario.student.firstName + ' ' + s.scenario.student.lastName,
        exam: s.scenario.exam.title
      })),
      _prototype: true
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  EventGenerator,
  NormalExamScenario,
  SuspiciousActivityScenario,
  ViolationScenario,
  IntermittentIssuesScenario
};
