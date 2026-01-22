# Issues Inventory
## Evalon - AI-Powered Exam Proctoring Platform

**Created:** December 11, 2025  
**Last Updated:** December 11, 2025  
**Status:** Phase 0 - Discovery Complete

---

## Issue Status Legend
- ⬜ = Not Started
- 🔄 = In Progress
- ✅ = Completed
- ❌ = Cancelled/Won't Fix

---

## Critical (Blocking deployment/functionality)

### Security Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| C-1 | ✅ | Firebase service account credentials exposed in repo | `backend/evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json` | **FIXED** - File deleted, regenerate credentials |
| C-2 | ✅ | Google OAuth client secret exposed in repo | `backend/client_secret_795807047739-ve24mbnbtis97gin5bchervqv3qkcgcf.apps.googleusercontent.com.json` | **FIXED** - File deleted, regenerate credentials |
| C-3 | ✅ | No root `.gitignore` file | `/` (project root) | **FIXED** - Comprehensive .gitignore created |

### Configuration Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| C-4 | ✅ | Log files committed to repository | `backend/*.log`, `backend_startup.log` | **FIXED** - Log files deleted |
| C-5 | ✅ | Build artifacts committed | `frontend/build/` | **FIXED** - Build directory deleted |

---

## High (Causes frequent problems)

### Architecture Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| H-1 | ⬜ | Frontend uses custom state-based navigation instead of React Router | `frontend/src/App.js` | **HIGH** - No URL routing, no deep linking, poor UX |
| H-2 | ⬜ | React Router DOM installed but not utilized | `frontend/package.json` | **MEDIUM** - Wasted dependency, inconsistent architecture |

### File Organization Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| H-3 | ✅ | 20+ debug/test scripts at backend root | `backend/*.js` (root level) | **FIXED** - Moved to backend/scripts/debug and maintenance |
| H-4 | ✅ | Backup file in production code | `backend/src/controllers/authController.js.backup` | **FIXED** - File deleted |
| H-5 | ⬜ | Python virtual environment in repo | `python/venv/` | **MEDIUM** - Now gitignored, needs manual removal |
| H-6 | ✅ | Coverage directory in repo | `backend/coverage/` | **FIXED** - Directory deleted |
| H-7 | ✅ | Playwright report in repo | `backend/playwright-report/` | **FIXED** - Directory deleted |

### Duplicate/Redundant Files

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| H-8 | ✅ | Duplicate route file | `backend/src/routes/questionBank.js` AND `questionBankRoutes.js` | **FIXED** - questionBank.js deleted |

---

## Medium (Code quality/maintainability)

### Documentation Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| M-1 | ✅ | 32 markdown files at project root | `/` (project root) | **FIXED** - Moved to /docs directory |
| M-2 | ✅ | Reference UI folder with space in name | `reference ui/` | **FIXED** - Folder removed (was empty) |
| M-3 | ✅ | Multiple redundant session/progress reports | Various `*_REPORT.md`, `*_SUMMARY.md` | **FIXED** - Moved to /docs/reports |

### Naming/Structure Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| M-4 | ⬜ | Python directory should be named ai-service | `python/` | **LOW** - Unclear purpose from name |
| M-5 | ⬜ | Empty demo component directory | `frontend/src/components/demo/` | **LOW** - Unused directory |
| M-6 | ⬜ | Root package.json only has devDependency | `/package.json` | **LOW** - Unclear purpose |

### Code Quality Issues

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| M-7 | ⬜ | Console.log statements in production code | `frontend/src/App.js` (lines 203-227) | **LOW** - Debug output in production |
| M-8 | ⬜ | Frontend loading screen hardcoded inline styles | `frontend/src/App.js` (lines 281-296) | **LOW** - Should use theme/CSS |

---

## Low (Nice to fix)

### Optimization Opportunities

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| L-1 | ⬜ | No Docker configuration | `/` (missing) | **LOW** - Manual deployment complexity |
| L-2 | ⬜ | No CI/CD pipeline | `/` (missing `.github/workflows/`) | **LOW** - Manual testing/deployment |
| L-3 | ⬜ | No Makefile for common commands | `/` (missing) | **LOW** - Developer convenience |
| L-4 | ⬜ | Large ML model file in repo | `python/suspicious_activity_model.h5` | **LOW** - Could use Git LFS |

### Enhancement Opportunities

| # | Status | Issue | File Location | Impact |
|---|--------|-------|---------------|--------|
| L-5 | ⬜ | No TypeScript in frontend | `frontend/` | **LOW** - Type safety improvement |
| L-6 | ⬜ | No ESLint configuration | `frontend/` (missing) | **LOW** - Code quality enforcement |
| L-7 | ⬜ | No Prettier configuration | `/` (missing) | **LOW** - Code formatting consistency |

---

## Files to Delete (Pending Approval)

### Credential Files (MUST DELETE)
```
backend/client_secret_795807047739-ve24mbnbtis97gin5bchervqv3qkcgcf.apps.googleusercontent.com.json
backend/evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json
```

### Log Files
```
backend/server.log
backend/monitoring.log
backend/monitoring-server.log
backend/student-exam-server.log
backend_startup.log
```

### Build/Coverage Artifacts
```
frontend/build/
backend/coverage/
backend/playwright-report/
backend/test-results/
```

### Backup Files
```
backend/src/controllers/authController.js.backup
```

### Debug/Test Scripts at Backend Root (Move to tests/ or delete)
```
backend/check-all-org-admins.js
backend/check-and-create-user.js
backend/check-stored-password.js
backend/check-users.js
backend/create-student-user.js
backend/create-teacher-user.js
backend/create-test-teacher-with-first-login.js
backend/create-test-user-with-first-login.js
backend/create-user-correctly.js
backend/debug-login.js
backend/debug-userid.js
backend/fix-all-org-admins.js
backend/fix-existing-users.js
backend/fix-student-email-verification.js
backend/fix-user-emails.js
backend/fix-user-organization.js
backend/investigate-registrations.js
backend/recreate-user.js
backend/test-bulk-creation.js
backend/test-bulk-direct.js
backend/test-email-verification-fix.js
backend/test-login.js
backend/test-password-flow.js
backend/test-password-logic.js
backend/test-question-bank.js
backend/test-realtime-websocket.js
backend/test-registration-flow.js
backend/test-user-creation.js
backend/cookies.txt
```

### Documentation to Consolidate (Move to /docs)
```
ACTION_PLAN.md
AI_PROCTORING_IMPLEMENTATION.md
CHANGELOG.md
COMPLETE_UNDERSTANDING_DOCUMENT.md
COMPREHENSIVE_PROJECT_ASSESSMENT_AND_ROADMAP.md
CONSISTENCY_FIXES.md
CONTROLLER_SERVICE_MIGRATION_BLUEPRINT.md
DATABASE_CONNECTION_FIX_REPORT.md
DATABASE_CONNECTION_SCAN_REPORT.md
DATABASE_SCHEMA_CONSISTENCY_REPORT.md
DEPLOYMENT_GUIDE.md
DEVELOPER_QUICK_REFERENCE.md
EXECUTIVE_SUMMARY.md
FINAL_SESSION_REPORT.md
FINAL_SESSION_SUMMARY.md
FIREBASE_ERRORS_FIX.md
IMPROVEMENTS_SUMMARY.md
NEXT_ACTIONS_CHECKLIST.md
PHASE_2_TO_PHASE_3_TRANSITION_AUDIT_REPORT.md
PRIORITY_1_FIX_EXECUTION_REPORT.md
PROGRESS_REPORT.md
PROJECT_STATUS_DASHBOARD.md
PROJECT_STATUS_REPORT.md
QUICK_START_FIX_GUIDE.md
QUICK_START.md
REALTIME_INTEGRATION_GUIDE.md
REALTIME_SPLIT_PROGRESS.md
REALTIME_WEBSOCKET_GUIDE.md
SCHEMA_CRITICAL_FIXES_REPORT.md
SCHEMA_INDEX_ANALYSIS_REPORT.md
SCHEMA_INDEX_BLUEPRINT.md
SCHEMA_SAFE_MODE_CLEANUP_REPORT.md
SESSION_SUMMARY.md
STARTUP_VALIDATION_BLUEPRINT.md
ULTIMATE_SESSION_ACHIEVEMENTS.md
VERIFICATION_REPORT.md
git_log_detailed.txt
git_log_with_datetime.txt
git_log.txt
```

### Root Test Files (Move to backend/tests or delete)
```
test-comprehensive.js
test-mark-expired.js
test-password-hashing.js
test-phone-otp-debug.js
test-realtime-integration.js
```

---

## Summary Statistics

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 5 | ✅ 5 fixed |
| High | 8 | ✅ 7 fixed, ⬜ 1 pending |
| Medium | 8 | ✅ 3 fixed, ⬜ 5 pending |
| Low | 7 | ⬜ 7 pending |
| **Total** | **28** | **✅ 15 fixed, ⬜ 13 pending** |

### Files Identified for Deletion/Movement
- Credential files: 2
- Log files: 5
- Build artifacts: 4 directories
- Backup files: 1
- Debug scripts: 27
- Documentation files: 38
- Root test files: 5

**Total files/directories to clean: 82**

---

## Resolution Plan

### Immediate Actions (Phase 1)
1. Create root `.gitignore` with comprehensive patterns
2. Remove credential JSON files from repo and history
3. Remove log files from repo
4. Remove build artifacts from repo

### Short-term Actions (Phase 1-2)
1. Move debug scripts to proper location
2. Consolidate documentation
3. Implement React Router

### Medium-term Actions (Phase 3-7)
1. Add Docker configuration
2. Setup CI/CD
3. Add ESLint/Prettier
4. Consider TypeScript migration

---

*This inventory will be updated as issues are resolved.*

