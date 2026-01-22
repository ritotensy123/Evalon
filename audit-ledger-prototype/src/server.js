/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Evalon Audit Ledger Service
 * Exam Integrity & Compliance Platform
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service provides blockchain-style audit capabilities for the Evalon
 * proctoring platform, enabling immutable record-keeping of all exam
 * integrity events for compliance and forensic analysis.
 * 
 * CAPABILITIES:
 * - Append-only, tamper-evident audit records
 * - Cryptographic hash chain verification
 * - Session-based event organization
 * - Forensic-level audit trail reconstruction
 * - Compliance-ready data export
 * 
 * SERVICE ARCHITECTURE:
 * - Independent service running on dedicated port
 * - No shared runtime state with core platform
 * - Read-only UI for audit personnel
 * - Write access restricted to authorized systems
 * 
 * FUTURE INTEGRATION POINTS:
 * - Distributed ledger network backend
 * - Real-time event stream ingestion
 * - Multi-node consensus mechanism
 * - Cloud-based immutable storage
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import API routes
const apiRoutes = require('./api/routes');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PORT = process.env.AUDIT_LEDGER_PORT || 7100;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS APPLICATION SETUP
// ═══════════════════════════════════════════════════════════════════════════

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Service headers
app.use((req, res, next) => {
  res.setHeader('X-Service', 'Evalon-Audit-Ledger');
  res.setHeader('X-Service-Version', '1.0.0');
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Static Files (Audit UI)
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api', apiRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Root & Fallback Routes
// ─────────────────────────────────────────────────────────────────────────────

// Root endpoint
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  
  res.json({
    service: 'Evalon Audit Ledger',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      dashboard: '/',
      health: '/api/health',
      status: '/api/status',
      ledger: '/api/ledger',
      sessions: '/api/sessions',
      violations: '/api/violations',
      verify: '/api/verify',
      events: '/api/events (POST)',
      reference: '/api/reference/event-types'
    },
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Evalon Audit Ledger API',
    version: '1.0.0',
    description: 'Immutable audit record system for exam integrity and compliance',
    baseUrl: `http://${HOST}:${PORT}/api`,
    endpoints: [
      {
        category: 'Health & Status',
        routes: [
          { method: 'GET', path: '/health', description: 'Service health check' },
          { method: 'GET', path: '/status', description: 'Detailed service status' }
        ]
      },
      {
        category: 'Write Operations',
        routes: [
          { method: 'POST', path: '/events', description: 'Append audit event' },
          { method: 'POST', path: '/events/batch', description: 'Append multiple events' }
        ]
      },
      {
        category: 'Read Operations',
        routes: [
          { method: 'GET', path: '/ledger', description: 'Get audit records (paginated)' },
          { method: 'GET', path: '/ledger/statistics', description: 'Get ledger statistics' },
          { method: 'GET', path: '/blocks/:index', description: 'Get record by index' },
          { method: 'GET', path: '/blocks/hash/:hash', description: 'Get record by hash' },
          { method: 'GET', path: '/transactions/:id', description: 'Get record by transaction ID' }
        ]
      },
      {
        category: 'Session Audit',
        routes: [
          { method: 'GET', path: '/sessions', description: 'List all sessions' },
          { method: 'GET', path: '/sessions/:sessionId', description: 'Get session audit trail' },
          { method: 'GET', path: '/sessions/:sessionId/timeline', description: 'Get session timeline' }
        ]
      },
      {
        category: 'Filtering',
        routes: [
          { method: 'GET', path: '/violations', description: 'Get flagged events' },
          { method: 'GET', path: '/events/filter', description: 'Filter events by type/severity' }
        ]
      },
      {
        category: 'Integrity Verification',
        routes: [
          { method: 'GET', path: '/verify', description: 'Verify complete ledger integrity' },
          { method: 'GET', path: '/verify/session/:sessionId', description: 'Verify session integrity' },
          { method: 'GET', path: '/verify/block/:index', description: 'Verify specific record' }
        ]
      },
      {
        category: 'Administration',
        routes: [
          { method: 'GET', path: '/export', description: 'Export ledger as JSON' },
          { method: 'POST', path: '/reset', description: 'Reset ledger' },
          { method: 'POST', path: '/generate', description: 'Generate test scenarios' }
        ]
      },
      {
        category: 'Reference',
        routes: [
          { method: 'GET', path: '/reference/event-types', description: 'List all event types' }
        ]
      }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    documentation: '/api/docs'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('   ███████╗██╗   ██╗ █████╗ ██╗      ██████╗ ███╗   ██╗');
  console.log('   ██╔════╝██║   ██║██╔══██╗██║     ██╔═══██╗████╗  ██║');
  console.log('   █████╗  ██║   ██║███████║██║     ██║   ██║██╔██╗ ██║');
  console.log('   ██╔══╝  ╚██╗ ██╔╝██╔══██║██║     ██║   ██║██║╚██╗██║');
  console.log('   ███████╗ ╚████╔╝ ██║  ██║███████╗╚██████╔╝██║ ╚████║');
  console.log('   ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝');
  console.log('');
  console.log('   AUDIT LEDGER SERVICE');
  console.log('   Exam Integrity & Compliance Platform');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   🔗 Service URL:     http://${HOST}:${PORT}`);
  console.log(`   📊 Dashboard:       http://${HOST}:${PORT}/`);
  console.log(`   📋 API Docs:        http://${HOST}:${PORT}/api/docs`);
  console.log(`   ❤️  Health Check:    http://${HOST}:${PORT}/api/health`);
  console.log(`   🔍 Ledger:          http://${HOST}:${PORT}/api/ledger`);
  console.log(`   📝 Sessions:        http://${HOST}:${PORT}/api/sessions`);
  console.log(`   ⚠️  Violations:      http://${HOST}:${PORT}/api/violations`);
  console.log(`   ✅ Verify:          http://${HOST}:${PORT}/api/verify`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📤 Shutting down Audit Ledger Service...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n📤 Shutting down Audit Ledger Service...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
