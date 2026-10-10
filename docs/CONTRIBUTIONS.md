# Contributing Guide

Thank you for your interest in contributing to **Fiku**! 🌟

Fiku is a personal finance management platform built with an end-to-end **Zero-Knowledge Encryption** architecture (ECIES X25519 + AES-256-GCM). This document outlines the branch workflow, coding standards, security requirements, and practical steps to set up your local development environment.

---

## 🧭 Branch & Git Workflow

To maintain production stability for continuous deployments on Vercel, Fiku follows a **Staged Trunk-Based Development** model:

```text
[ Contributor Fork ]
       │  (feat/... or fix/...)
       ▼
 [ PR to staging ] ──▶ [ Review & CI Test Suite ] ──▶ [ Merge into staging ]
                                                             │
                                                             ▼ (Promote/PR by Maintainer)
                                                        [ branch main ] ──▶ [ Vercel Production Auto-Deploy ]
```

### Core Rules:
1. **Target Branch is `staging`**:
   - All contributor Pull Requests **MUST target the `staging` branch**.
   - Direct PRs to `main` are restricted by GitHub Rulesets and automated CI Gatekeepers, and will be rejected automatically.
2. **Promoting Staging to Main**:
   - Once features and fixes have stabilized in `staging`, the repository maintainer (`@fikrisyahid`) will promote changes into `main` to trigger the production deployment.

---

## 🛠️ Prerequisites & Environment Setup

Ensure the following tools are installed on your development machine (Linux / WSL2 / macOS):

- **[Bun](https://bun.sh/)** (`bun >= 1.4`): Primary JavaScript runtime, package manager, and test runner.
- **[uv](https://docs.astral.sh/uv/)** (Python >= 3.11): Used by the ops task runner for automatic `.env` synchronization.
- **PostgreSQL Database**:
  - Recommended: Free [Supabase](https://supabase.com/) PostgreSQL instance (Session Pooler).
  - Alternatively: Local PostgreSQL instance (v15+).
- **Git** (Configured with GPG commit signing recommended).

---

## 🚀 Step-by-Step Local Setup

### 1. Fork & Clone the Repository
```bash
# 1. Fork the fikrisyahid/fiku repository on GitHub
# 2. Clone your fork locally
git clone https://github.com/<your-username>/fiku.git
cd fiku

# 3. Create your working branch branched off staging
git checkout staging 2>/dev/null || git checkout -b staging origin/staging
git checkout -b feat/your-feature-name
```

### 2. Configure Environment Variables
Copy the root environment template:
```bash
cp .env.example .env
```
Open `.env` and fill in the required variables:
```env
# PostgreSQL connection string (Supabase Session Pooler or direct)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Server Pepper for PBKDF2 cryptographic key derivation
ENCRYPTION_PEPPER=fana_secure_server_pepper_default_2026

# Master Application Secret Key (Double Protection layer)
APP_SECRET_KEY=fana_app_secret_key_double_protection_2026
```
*(The Fiku ops workflow automatically mirrors the root `.env` to `main/.env`).*

### 3. Install Dependencies
```bash
bun run install:main
```

### 4. Synchronize Database Schema
Apply tables, columns, constraints, and composite indexes to your database:
```bash
bun run db:sync
```

*(Optional: Populate demo accounts with encrypted dummy records for testing):*
```bash
bun run seed:dummy
```

### 5. Start the Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 CLI Reference

Run these commands from the repository root:

| Command | Description |
| :--- | :--- |
| `bun run dev` | Starts the Next.js development server on port 3000 |
| `bun run test` | Runs the full unit & integration test suite (`tests/`) |
| `bun run check` | Validates TypeScript types across the codebase (`tsc --noEmit`) |
| `bun run lint` | Runs ESLint checks across all files |
| `bun run build` | Builds an optimized production bundle to ensure zero compilation errors |
| `bun run db:sync` | Synchronizes PostgreSQL schema definitions and indexes (`scripts/db-sync.ts`) |
| `bun run db:studio` | Launches Drizzle Studio in the browser for visual database inspection |
| `bun run db:reset` | Wipes and resets all database table rows (`scripts/db-reset.ts`) |
| `bun run sync:env` | Synchronizes `.env` files between root and the `main/` directory |

---

## 🔐 Zero-Knowledge Security Compliance (Mandatory)

Fiku prioritizes strict privacy and user data sovereignty. All contributors must adhere to these cryptographic principles:

1. **No Plaintext Financial Values**:
   - `accounts.balance`, `transactions.amount`, and `transactions.note` **MUST NEVER** be stored as raw plaintext in the database.
   - Values must be encrypted with the user's public key (`encryptWithPublicKey`) before being written to PostgreSQL.
   - Ciphertext stored in the database must always follow the format: `enc:v1:<ephemeralPubDer>:<iv>:<authTag>:<ciphertext>`.
2. **Private Key Isolation**:
   - Private keys are decrypted in-memory only during an active user session and sealed inside an encrypted HTTP-only cookie (`fana_key_vault`). Plaintext private keys must never be logged or written to disk/database.
3. **Password & PIN Security**:
   - Passwords are encrypted using bcrypt (10 rounds).
   - PINs are hashed using SHA-256 combined with per-user salts and server peppers, compared strictly via `crypto.timingSafeEqual`.

---

## 🧪 Testing Guidelines

Every new feature or bug fix must include relevant test coverage in the `tests/` directory:

- **Unit Tests** (`tests/unit/`): Isolated pure logic (cryptography routines, currency formatting, date range calculations).
- **Integration Tests** (`tests/integration/`): Multi-component logic (Smart Input natural language parsing, pagination, and sorting fallbacks).

Run tests locally before submitting your Pull Request:
```bash
# 1. Run all test suites
bun run test

# 2. Verify TypeScript type safety
bun run check

# 3. Verify production build passes
bun run build
```

---

## 📝 Commit Conventions & Pull Request Submission

### Commit Message Guidelines (Conventional Commits):
Format: `<type>(<scope>): <short description>`
- `feat(smart-input): add multi-currency transfer support`
- `fix(summary): resolve annual balance aggregation edge case`
- `perf(db): optimize date sorting with composite index`
- `test(crypto): add test case for in-memory session vault`
- `docs(contributions): translate guidelines into English`

### Submitting a Pull Request:
1. Rebase or pull the latest changes from `staging` into your branch (`git pull origin staging`).
2. Open a Pull Request on GitHub with the **base branch set to `staging`** (never `main`).
3. Complete the Pull Request template ([`.github/pull_request_template.md`](../.github/pull_request_template.md)).
4. Ensure all automated GitHub Actions CI checks are **green**.
5. The maintainer will review your code, provide constructive feedback, or merge the PR.

Thank you for helping build a secure, privacy-first personal finance platform! 🚀
