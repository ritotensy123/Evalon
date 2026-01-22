# 🔗 Evalon Audit Ledger Prototype

```
██████╗ ██████╗  ██████╗ ████████╗ ██████╗ ████████╗██╗   ██╗██████╗ ███████╗
██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔═══██╗╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝
██████╔╝██████╔╝██║   ██║   ██║   ██║   ██║   ██║    ╚████╔╝ ██████╔╝█████╗  
██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║   ██║   ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  
██║     ██║  ██║╚██████╔╝   ██║   ╚██████╔╝   ██║      ██║   ██║     ███████╗
╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝    ╚═╝      ╚═╝   ╚═╝     ╚══════╝
```

## ⚠️ IMPORTANT DISCLAIMER

> **THIS IS A PROTOTYPE SERVICE**
> 
> - ❌ NOT connected to any production systems
> - ❌ NOT receiving real exam or proctoring data
> - ❌ NOT affecting any live services
> - ✅ Uses SIMULATED data for demonstration only
> - ✅ For architectural validation and evaluation purposes

---

## 📋 Overview

This is a **standalone prototype** of a blockchain-style audit ledger designed for the Evalon AI-based proctoring platform. It demonstrates how an immutable, tamper-evident audit system would work for recording and verifying exam integrity events.

### Purpose

- **Architectural Validation**: Prove the viability of blockchain-style auditing
- **Demonstration**: Show audit trail capabilities to stakeholders
- **Academic/Evaluation**: Support research and assessment needs
- **Future Integration Planning**: Establish interfaces for production implementation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUDIT LEDGER PROTOTYPE                          │
│                        (Port 7100)                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   REST API  │  │  Audit UI   │  │  Event Gen  │                 │
│  │  /api/*     │  │  /          │  │ (Simulated) │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         └────────────────┴────────────────┘                         │
│                          │                                          │
│  ┌───────────────────────┴───────────────────────┐                 │
│  │              AUDIT LEDGER CORE                │                 │
│  │  ┌─────────────┐  ┌─────────────────────┐    │                 │
│  │  │ LedgerBlock │  │    AuditLedger      │    │                 │
│  │  │  - hash     │  │  - append only      │    │                 │
│  │  │  - prevHash │  │  - hash chained     │    │                 │
│  │  │  - payload  │  │  - immutable        │    │                 │
│  │  └─────────────┘  └─────────────────────┘    │                 │
│  └───────────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘

                    ║ COMPLETE ISOLATION ║
                    ╚════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│            EVALON PRODUCTION SYSTEM (UNCHANGED)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Main API │  │ Realtime │  │AI Service│  │ Frontend │           │
│  │ :5001    │  │ :5004    │  │ :5002    │  │ :3001    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

```bash
# Navigate to the prototype directory
cd audit-ledger-prototype

# Install dependencies
npm install

# Start the service
npm start
```

### Access Points

| Resource | URL |
|----------|-----|
| Audit UI | http://localhost:7100 |
| API Docs | http://localhost:7100/api/docs |
| Health Check | http://localhost:7100/api/health |

---

## 📚 API Reference

### Health & Status

```bash
# Health check
GET /api/health

# Detailed status
GET /api/status
```

### Write Operations

```bash
# Append single event
POST /api/events
{
  "sessionId": "SES-123",
  "eventType": "face_detected",
  "payload": { "confidence": 0.95 }
}

# Batch append
POST /api/events/batch
{
  "events": [...]
}
```

### Read Operations

```bash
# Get ledger (paginated)
GET /api/ledger?limit=100&offset=0

# Get statistics
GET /api/ledger/statistics

# Get block by index
GET /api/blocks/:index

# Get block by hash
GET /api/blocks/hash/:hash

# Get block by transaction ID
GET /api/transactions/:transactionId
```

### Session Audit

```bash
# List all sessions
GET /api/sessions

# Get session audit trail
GET /api/sessions/:sessionId

# Get session timeline
GET /api/sessions/:sessionId/timeline
```

### Filtering

```bash
# Get all violations
GET /api/violations

# Filter by type/severity
GET /api/events/filter?eventType=face_lost&severity=warning
```

### Integrity Verification

```bash
# Verify full ledger
GET /api/verify

# Verify session
GET /api/verify/session/:sessionId

# Verify specific block
GET /api/verify/block/:index
```

### Prototype Management

```bash
# Export ledger
GET /api/export

# Reset with fresh demo data
POST /api/reset

# Generate additional scenarios
POST /api/generate
{
  "count": 2,
  "type": "violation"  // normal, suspicious, violation, intermittent
}
```

---

## 🔐 Ledger Block Structure

Each block in the ledger contains:

```javascript
{
  index: 42,                              // Sequential block number
  transactionId: "tx-abc123...",          // Unique transaction ID
  sessionId: "SES-XYZ789",                // Exam session identifier
  eventType: "behavior_suspicious",       // Event classification
  eventSummary: "Suspicious behavior...", // Human-readable summary
  payload: {                              // Structured event data
    confidence: 0.78,
    indicators: ["gaze_deviation"]
  },
  timestamp: "2025-01-22T10:30:00.000Z", // UTC timestamp
  previousHash: "a1b2c3d4...",           // Hash of previous block
  hash: "e5f6g7h8...",                   // SHA-256 hash of this block
  severity: "warning",                    // Computed severity level
  hashValid: true                         // Integrity flag
}
```

### Hash Calculation

The block hash is computed as:
```
SHA-256(JSON.stringify({
  index, transactionId, sessionId, eventType,
  eventSummary, payload, timestamp, previousHash
}))
```

---

## 📊 Event Types

### Session Lifecycle
- `session_start` - Exam session started
- `session_end` - Exam session ended
- `session_pause` - Session paused
- `session_resume` - Session resumed

### Face Detection
- `face_detected` - Face detected in frame
- `face_lost` - Face lost from frame
- `multiple_faces` - **VIOLATION** - Multiple faces detected
- `no_face` - No face in frame

### Behavior Classification
- `behavior_normal` - Normal behavior
- `behavior_suspicious` - Suspicious behavior detected
- `behavior_very_suspicious` - **VIOLATION** - Very suspicious behavior

### Credibility
- `credibility_update` - Score updated
- `credibility_threshold_breach` - **VIOLATION** - Below threshold

### Security Events
- `tab_switch` - Tab switch attempt
- `window_blur` - Window lost focus
- `copy_attempt` - Copy blocked
- `paste_attempt` - Paste blocked
- `right_click` - Right-click blocked
- `keyboard_shortcut` - Shortcut blocked

---

## 🎯 Design Principles

### 1. Isolation
> "The audit system must observe, never control"

The ledger runs completely independently and never influences the core proctoring system.

### 2. Immutability
> "Once written, always preserved"

Blocks cannot be modified after creation. Any attempt throws an exception.

### 3. Tamper Evidence
> "Detection is mandatory, interference is forbidden"

Hash chaining ensures any tampering is immediately detectable.

### 4. Chronological Integrity
> "Time tells the truth"

Events are strictly time-ordered with UTC timestamps.

---

## 🔮 Future Replacement Points

This prototype is designed with clear replacement points for production:

| Component | Current | Production Replacement |
|-----------|---------|----------------------|
| Storage | In-memory | Distributed ledger / Blockchain |
| Events | Simulated | Real-time ingestion from core system |
| Consensus | Single-node | Multi-node consensus (PBFT, Raft) |
| Persistence | None | Immutable cloud storage |
| Authentication | None | JWT / API Keys |

### Integration Pattern (Future)

```javascript
// In production, the core system would fire events like:
auditClient.fireAndForget({
  sessionId: examSession.id,
  eventType: 'behavior_suspicious',
  payload: aiDetectionResult
});

// Non-blocking, one-way communication
// Core system continues regardless of ledger response
```

---

## 📁 Project Structure

```
audit-ledger-prototype/
├── package.json           # Dependencies and scripts
├── README.md              # This documentation
└── src/
    ├── server.js          # Express server entry point
    ├── demo.js            # CLI demonstration script
    ├── ledger/
    │   ├── index.js       # Module exports
    │   ├── LedgerBlock.js # Immutable block class
    │   └── AuditLedger.js # Ledger manager
    ├── api/
    │   └── routes.js      # REST API endpoints
    ├── simulation/
    │   └── eventGenerator.js # Demo data generation
    └── public/
        └── index.html     # Audit UI dashboard
```

---

## 🧪 Demo Mode

Run the demo script to see the ledger in action without HTTP:

```bash
npm run demo
```

This will:
1. Create a new ledger with genesis block
2. Generate simulated exam sessions
3. Display session summaries
4. Verify ledger integrity
5. Show statistics and violations
6. Demonstrate hash chain linking

---

## ⚠️ Constraints & Limitations

### What This Prototype Does NOT Do

- ❌ Connect to production databases
- ❌ Receive real proctoring events
- ❌ Persist data between restarts
- ❌ Implement real blockchain consensus
- ❌ Use cryptographic signing
- ❌ Support multi-node replication

### What This Prototype DOES Do

- ✅ Demonstrate blockchain-style hash chaining
- ✅ Provide append-only, immutable structure
- ✅ Detect tampering through hash verification
- ✅ Organize events by session
- ✅ Filter by severity and type
- ✅ Provide a read-only audit UI
- ✅ Generate realistic simulated data

---

## 📄 License

MIT License - For evaluation and demonstration purposes only.

---

## 🏷️ Version

**v0.1.0** - Prototype Release

---

<div align="center">

**⚠️ PROTOTYPE - NOT FOR PRODUCTION USE ⚠️**

*This service uses simulated data and is not connected to any production system.*

</div>

