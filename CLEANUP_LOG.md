# Cleanup Log
## Evalon - Files Pending Deletion/Movement

**Created:** December 11, 2025  
**Status:** Pending Approval

---

## ⚠️ IMPORTANT

**NO FILES HAVE BEEN DELETED YET**

This log documents files identified for removal or relocation. All deletions require explicit approval before execution.

---

## 🚨 Critical: Credential Files (MUST DELETE)

These files contain sensitive credentials and **MUST** be removed from the repository and git history:

| File | Size | Reason |
|------|------|--------|
| `backend/client_secret_795807047739-ve24mbnbtis97gin5bchervqv3qkcgcf.apps.googleusercontent.com.json` | ~2KB | Google OAuth client secret - SECURITY RISK |
| `backend/evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json` | ~3KB | Firebase service account - SECURITY RISK |

**Post-deletion action required:**
1. Rotate credentials in Google Cloud Console
2. Generate new Firebase service account
3. Store new credentials via environment variables
4. Update `.env.example` files with new variable names

---

## Log Files (DELETE)

| File | Size | Reason |
|------|------|--------|
| `backend/server.log` | Variable | Runtime log - may contain sensitive data |
| `backend/monitoring.log` | Variable | Runtime log |
| `backend/monitoring-server.log` | Variable | Runtime log |
| `backend/student-exam-server.log` | Variable | Runtime log |
| `backend_startup.log` | Variable | Startup log |

---

## Build/Test Artifacts (DELETE DIRECTORIES)

| Directory | Reason |
|-----------|--------|
| `frontend/build/` | Build output - should be generated during deployment |
| `backend/coverage/` | Test coverage report - regeneratable |
| `backend/playwright-report/` | Test report - regeneratable |
| `backend/test-results/` | Test results - regeneratable |
| `python/venv/` | Python virtual environment - should be created locally |

---

## Backup Files (DELETE)

| File | Reason |
|------|--------|
| `backend/src/controllers/authController.js.backup` | Backup file - use git for versioning |
| `backend/cookies.txt` | Debug file |

---

## Debug/Test Scripts (MOVE OR DELETE)

**Recommendation:** Move to `backend/scripts/debug/` or delete

| File | Recommendation |
|------|----------------|
| `backend/check-all-org-admins.js` | Move to scripts/ |
| `backend/check-and-create-user.js` | Move to scripts/ |
| `backend/check-stored-password.js` | Move to scripts/ |
| `backend/check-users.js` | Move to scripts/ |
| `backend/create-student-user.js` | Move to scripts/ |
| `backend/create-teacher-user.js` | Move to scripts/ |
| `backend/create-test-teacher-with-first-login.js` | Move to scripts/ |
| `backend/create-test-user-with-first-login.js` | Move to scripts/ |
| `backend/create-user-correctly.js` | Move to scripts/ |
| `backend/debug-login.js` | Delete (debug) |
| `backend/debug-userid.js` | Delete (debug) |
| `backend/fix-all-org-admins.js` | Move to scripts/ |
| `backend/fix-existing-users.js` | Move to scripts/ |
| `backend/fix-student-email-verification.js` | Move to scripts/ |
| `backend/fix-user-emails.js` | Move to scripts/ |
| `backend/fix-user-organization.js` | Move to scripts/ |
| `backend/investigate-registrations.js` | Delete (debug) |
| `backend/recreate-user.js` | Move to scripts/ |
| `backend/test-bulk-creation.js` | Delete or move to tests/ |
| `backend/test-bulk-direct.js` | Delete or move to tests/ |
| `backend/test-email-verification-fix.js` | Delete or move to tests/ |
| `backend/test-login.js` | Delete or move to tests/ |
| `backend/test-password-flow.js` | Delete or move to tests/ |
| `backend/test-password-logic.js` | Delete or move to tests/ |
| `backend/test-question-bank.js` | Delete or move to tests/ |
| `backend/test-realtime-websocket.js` | Delete or move to tests/ |
| `backend/test-registration-flow.js` | Delete or move to tests/ |
| `backend/test-user-creation.js` | Delete or move to tests/ |

**Root level test files (MOVE TO backend/tests or DELETE):**

| File | Recommendation |
|------|----------------|
| `test-comprehensive.js` | Move to backend/tests/ |
| `test-mark-expired.js` | Move to backend/tests/ |
| `test-password-hashing.js` | Move to backend/tests/ |
| `test-phone-otp-debug.js` | Delete (debug) |
| `test-realtime-integration.js` | Move to backend/tests/ |

---

## Documentation Files (MOVE TO /docs)

The following files should be moved to a `/docs` directory to clean up the root:

**Keep at root:**
- `README.md` - Main documentation
- `PROJECT_AUDIT.md` - Audit report (new)
- `ISSUES_INVENTORY.md` - Issue tracking (new)
- `REPAIR_LOG.md` - Change log (new)
- `CLEANUP_LOG.md` - This file (new)

**Move to `/docs/architecture/`:**
- `COMPLETE_UNDERSTANDING_DOCUMENT.md`
- `COMPREHENSIVE_PROJECT_ASSESSMENT_AND_ROADMAP.md`

**Move to `/docs/deployment/`:**
- `DEPLOYMENT_GUIDE.md`
- `QUICK_START.md`
- `QUICK_START_FIX_GUIDE.md`

**Move to `/docs/development/`:**
- `DEVELOPER_QUICK_REFERENCE.md`
- `REALTIME_INTEGRATION_GUIDE.md`
- `REALTIME_WEBSOCKET_GUIDE.md`
- `AI_PROCTORING_IMPLEMENTATION.md`

**Move to `/docs/reports/` or DELETE (session-specific):**
- `ACTION_PLAN.md`
- `CHANGELOG.md`
- `CONSISTENCY_FIXES.md`
- `CONTROLLER_SERVICE_MIGRATION_BLUEPRINT.md`
- `DATABASE_CONNECTION_FIX_REPORT.md`
- `DATABASE_CONNECTION_SCAN_REPORT.md`
- `DATABASE_SCHEMA_CONSISTENCY_REPORT.md`
- `EXECUTIVE_SUMMARY.md`
- `FINAL_SESSION_REPORT.md`
- `FINAL_SESSION_SUMMARY.md`
- `FIREBASE_ERRORS_FIX.md`
- `IMPROVEMENTS_SUMMARY.md`
- `NEXT_ACTIONS_CHECKLIST.md`
- `PHASE_2_TO_PHASE_3_TRANSITION_AUDIT_REPORT.md`
- `PRIORITY_1_FIX_EXECUTION_REPORT.md`
- `PROGRESS_REPORT.md`
- `PROJECT_STATUS_DASHBOARD.md`
- `PROJECT_STATUS_REPORT.md`
- `REALTIME_SPLIT_PROGRESS.md`
- `SCHEMA_CRITICAL_FIXES_REPORT.md`
- `SCHEMA_INDEX_ANALYSIS_REPORT.md`
- `SCHEMA_INDEX_BLUEPRINT.md`
- `SCHEMA_SAFE_MODE_CLEANUP_REPORT.md`
- `SESSION_SUMMARY.md`
- `STARTUP_VALIDATION_BLUEPRINT.md`
- `ULTIMATE_SESSION_ACHIEVEMENTS.md`
- `VERIFICATION_REPORT.md`

**DELETE (git logs shouldn't be in repo):**
- `git_log_detailed.txt`
- `git_log_with_datetime.txt`
- `git_log.txt`

---

## Reference Files (MOVE OR DELETE)

| Item | Recommendation |
|------|----------------|
| `reference ui/` (entire directory) | Move to `/docs/design/` or delete |

---

## Deletion Summary

| Category | Count | Action |
|----------|-------|--------|
| Credential Files | 2 | DELETE (CRITICAL) |
| Log Files | 5 | DELETE |
| Build Directories | 5 | DELETE |
| Backup/Debug Files | 2 | DELETE |
| Backend Root Scripts | 27 | MOVE OR DELETE |
| Root Test Files | 5 | MOVE |
| Documentation Files | 38 | MOVE TO /docs |
| Git Log Files | 3 | DELETE |
| Reference UI | 1 dir | MOVE OR DELETE |

**Total items to process: 88**

---

## Approval Required

Before executing any deletions, please confirm:

1. ✅ I understand the credential files will be deleted and need to be regenerated
2. ✅ I have backups of any files I want to keep
3. ✅ I understand build artifacts will need to be regenerated
4. ✅ I approve moving documentation to /docs directory
5. ✅ I approve moving/deleting debug scripts

**To proceed with Phase 1, please confirm you approve the cleanup plan.**

---

*No files have been modified or deleted. This is a planning document only.*





