# Dependency & Supply Chain Security Report

**Date:** December 10, 2025
**Project:** Pilates Class Planner v2.0 - Frontend
**OWASP Coverage:** A03:2025 Software Supply Chain Failures, A08:2025

---

## Executive Summary

- **Initial Vulnerabilities:** 6 (5 moderate, 1 high)
- **Fixed Automatically:** 1 high severity (glob command injection)
- **Remaining Vulnerabilities:** 5 moderate (all related to esbuild/vite)
- **Status:** ⚠️ Action Required - Recommend upgrading Vite (requires testing)

---

## 1. Vulnerabilities Fixed ✅

### **High Severity: glob Command Injection** (GHSA-5j98-mcp5-4vw2)
- **Package:** `glob` (10.2.0 - 10.4.5)
- **Issue:** CLI command injection via `-c/--cmd` executes matches with `shell:true`
- **Fix:** Automatically updated via `npm audit fix`
- **Status:** ✅ **RESOLVED**

---

## 2. Remaining Vulnerabilities ⚠️

### **Moderate Severity: esbuild Development Server Vulnerability** (GHSA-67mh-4wv8-2f99)

**Affected Packages (5):**
1. `esbuild` (<=0.24.2)
2. `vite` (0.11.0 - 6.1.6) - depends on vulnerable esbuild
3. `vite-node` (<=2.2.0-beta.2) - depends on vulnerable vite
4. `vitest` (multiple ranges) - depends on vulnerable vite + vite-node
5. `@vitest/ui` (<=0.0.122 || 0.31.0 - 2.2.0-beta.2) - depends on vulnerable vitest

**Issue:**
esbuild development server allows any website to send requests to dev server and read responses

**Current Versions:**
- vite: `5.0.11` (in package.json: `^5.0.11`)
- vitest: `1.2.1` (in package.json: `^1.2.1`)
- @vitest/ui: `1.2.1` (in package.json: `^1.2.1`)

**Fix Available:**
`npm audit fix --force` will install vite `7.2.7` (**BREAKING CHANGE**)

**Risk Assessment:**
- **Development Only:** This vulnerability only affects the development server (not production)
- **Severity:** Moderate (not critical since it requires development environment access)
- **Recommendation:** Upgrade during next development sprint with proper testing

---

## 3. Outdated Packages Analysis

### **🔴 Major Version Updates Available (Breaking Changes Expected)**

These packages have major version bumps and should be updated carefully with testing:

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| **vite** | 5.0.11 | 7.2.7 | ⚠️ **SECURITY FIX** - Also fixes esbuild vulnerability |
| **vitest** | 1.2.1 | 4.0.15 | Update with vite |
| **@vitest/ui** | 1.2.1 | 4.0.15 | Update with vitest |
| **react** | 18.3.1 | 19.2.1 | React 19 released (stable) |
| **react-dom** | 18.3.1 | 19.2.1 | Update with react |
| **@types/react** | 18.3.3 | 19.2.7 | Update with react |
| **@types/react-dom** | 18.3.0 | 19.2.3 | Update with react-dom |
| **react-router-dom** | 6.30.2 | 7.10.1 | Major API changes |
| **@dnd-kit/sortable** | 8.0.0 | 10.0.0 | Check for breaking changes |
| **@hookform/resolvers** | 3.9.0 | 5.2.2 | Check for breaking changes |
| **@testing-library/react** | 14.1.2 | 16.3.0 | Update with React 19 |
| **@typescript-eslint/*** | 6.19.0 | 8.49.0 | ESLint plugin updates |
| **eslint** | 8.56.0 | 9.39.1 | ESLint 9 released |
| **eslint-plugin-react-hooks** | 4.6.0 | 7.0.1 | Update with React 19 |
| **tailwindcss** | 3.4.11 | 4.1.17 | Tailwind v4 released (major changes) |
| **tailwind-merge** | 2.5.2 | 3.4.0 | Update with tailwindcss |
| **date-fns** | 3.6.0 | 4.1.0 | Check for breaking changes |
| **zod** | 3.23.8 | 4.1.13 | Zod v4 (check schema changes) |
| **zustand** | 4.5.7 | 5.0.9 | State management updates |
| **sonner** | 1.5.0 | 2.0.7 | Toast library updates |
| **jsdom** | 24.0.0 | 27.3.0 | Test environment updates |

### **🟡 Minor/Patch Updates Available (Low Risk)**

These can be updated with less concern about breaking changes:

| Package | Current | Wanted | Latest |
|---------|---------|--------|--------|
| **@supabase/supabase-js** | 2.55.0 | 2.87.1 | 2.87.1 |
| **@tanstack/react-query** | 5.56.2 | 5.90.12 | 5.90.12 |
| **react-hook-form** | 7.53.0 | 7.68.0 | 7.68.0 |
| **lucide-react** | 0.462.0 | 0.462.0 | 0.559.0 |
| **@vitejs/plugin-react** | 4.2.1 | 4.7.0 | 5.1.2 |
| **prettier** | 3.2.4 | 3.7.4 | 3.7.4 |

---

## 4. Deprecation Status

**No deprecated packages detected** in current dependencies. All packages are actively maintained.

**Maintenance Status:**
- ✅ All core dependencies have recent commits (within last 3 months)
- ✅ All packages have active maintainers
- ✅ No packages flagged with security warnings on npm

---

## 5. Recommended Actions

### **🔥 Priority 1: Fix Security Vulnerability (esbuild/vite)**

**Option A: Upgrade Now (Recommended)**
```bash
# Backup current working state
git checkout -b security/vite-upgrade

# Update vite, vitest, @vitest/ui together
npm install vite@latest vitest@latest @vitest/ui@latest --save-dev

# Test thoroughly
npm run build
npm run test
npm run dev

# If all tests pass, commit and merge
git add package.json package-lock.json
git commit -m "security: Upgrade vite/vitest to fix esbuild vulnerability"
git push origin security/vite-upgrade
```

**Option B: Accept Risk (Not Recommended)**
- If upgrading immediately is not feasible, document the accepted risk
- Development-only vulnerability (production unaffected)
- Plan upgrade for next sprint
- Monitor for exploit activity

**Estimated Time:** 2-3 hours (upgrade + testing)

---

### **Priority 2: Update React to v19**

React 19 is now stable. Consider upgrading:

```bash
npm install react@latest react-dom@latest
npm install --save-dev @types/react@latest @types/react-dom@latest @testing-library/react@latest

# Update react-router-dom if using React 19 features
npm install react-router-dom@latest
```

**Breaking Changes to Review:**
- React 19 changes to useEffect cleanup timing
- New concurrent features
- Updated TypeScript types

**Estimated Time:** 4-6 hours (upgrade + testing + fixes)

---

### **Priority 3: Minor Updates (Safe)**

Update packages with low risk of breaking changes:

```bash
# Update Supabase client (bug fixes + performance)
npm install @supabase/supabase-js@latest

# Update React Query (bug fixes)
npm install @tanstack/react-query@latest

# Update form library (bug fixes)
npm install react-hook-form@latest

# Update prettier (formatting improvements)
npm install --save-dev prettier@latest
```

**Estimated Time:** 30 minutes

---

### **Priority 4: Set Up GitHub Dependabot**

**Action Required:** Enable Dependabot on GitHub repository

**Steps:**
1. Go to GitHub repository → Settings → Security → Code security
2. Enable **Dependabot alerts** (if not already enabled)
3. Enable **Dependabot security updates** (auto-creates PRs for vulnerabilities)
4. Optional: Enable **Dependabot version updates** (creates PRs for outdated packages)

**Benefits:**
- Automatic security vulnerability detection
- Auto-generated pull requests for fixes
- Weekly digest of dependency updates

**Configuration File:** `.github/dependabot.yml`
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "Lauraredmond"
```

**Estimated Time:** 10 minutes setup

---

## 6. Optional: Advanced Security Tools

### **Snyk CLI** (Free for open source)
```bash
npm install -g snyk
snyk auth
snyk test
snyk monitor
```

**Benefits:** More comprehensive vulnerability database, priority scoring

### **OWASP Dependency Check** (Most accurate)
```bash
brew install dependency-check
dependency-check --project "Pilates Class Planner" --scan ./frontend
```

**Benefits:** OWASP-curated vulnerability database, CVSS scoring

---

## 7. Monitoring Strategy

### **Automated Checks (Recommended)**
1. **GitHub Dependabot:** Weekly automated PRs for security updates
2. **npm audit in CI/CD:** Add to GitHub Actions workflow
3. **Pre-commit hook:** Run `npm audit` before commits

### **Manual Reviews (Quarterly)**
1. Run `npm outdated` to check for major version updates
2. Review changelog for breaking changes
3. Test upgrades in staging environment
4. Document any deferred upgrades with risk assessment

### **CI/CD Integration**

Add to `.github/workflows/security.yml`:
```yaml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm audit --audit-level=moderate
```

---

## 8. Summary & Next Steps

### **What You Need to Do:**

1. ✅ **DONE:** Ran `npm audit` and `npm audit fix` (fixed 1 high severity issue)
2. ⏸️ **DECIDE:** Upgrade vite/vitest now OR schedule for next sprint?
3. 📋 **TODO:** Enable GitHub Dependabot (10 minutes)
4. 📋 **TODO:** Schedule React 19 upgrade (next major version)
5. 📋 **TODO:** Run safe minor updates (30 minutes)

### **Current Security Posture**

- **Production Risk:** ✅ **LOW** - All production dependencies secure
- **Development Risk:** ⚠️ **MODERATE** - esbuild vulnerability (dev-only)
- **Supply Chain:** ✅ **GOOD** - No deprecated/unmaintained packages
- **Monitoring:** ⏸️ **PENDING** - Dependabot not yet enabled

### **Recommendation**

**Immediate Action (Today):**
1. Enable GitHub Dependabot
2. Run safe minor updates (`@supabase/supabase-js`, `@tanstack/react-query`, etc.)

**Near-Term Action (This Week):**
3. Upgrade vite/vitest to fix security vulnerability
4. Test thoroughly after upgrade

**Medium-Term Action (Next Sprint):**
5. Plan React 19 upgrade with comprehensive testing
6. Review and update ESLint/TypeScript configs

---

## 9. References

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [GitHub Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk vulnerability database](https://snyk.io/vuln/)
- [React 19 upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Vite migration guide](https://vitejs.dev/guide/migration)

---

**Report Generated:** December 10, 2025
**Next Review:** March 10, 2026 (Quarterly)
