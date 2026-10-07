# Fana Architecture Overview

This document provides a high-level overview of the **Fana Finance Platform** architecture.

---

## 🏗️ System Components

The system is built upon three primary pillars:

```
[ Telegram Client ]       [ Web Browser (User) ]
         │                           │
         ▼                           ▼
[ Telegram Webhook API ]    [ Next.js Dashboard UI ]
 (app/api/bot/route.ts)       (app/page.tsx, /login)
         │                           │
         └─────────────┬─────────────┘
                       ▼
             [ Server Actions & Lib ]
             - lib/bot.ts & handlers
             - lib/crypto.ts
             - app/actions/*
                       │
                       ▼
             [ PostgreSQL Database ]
              (Drizzle ORM Schema)
```

1. **Next.js 16 Web Dashboard** (`main/app`):
   - Clean and responsive user interface built with Tailwind CSS v4 and React 19.
   - Modular Server Actions for all data mutations (`app/actions/`).
   - Secure PIN-based authentication with salted SHA256 and HMAC verification.

2. **Telegram Bot Service** (`main/lib/bot.ts`):
   - Built with the **GrammY** bot framework.
   - In local development, runs via long-polling with `scripts/dev-bot.ts`.
   - In production (Cloudflare Workers / Serverless), runs statelessly via Webhook endpoint `POST /api/bot`.

3. **Data Layer (PostgreSQL + Drizzle ORM)** (`main/db/`):
   - Powered by connection-pooled PostgreSQL (`postgres`).
   - Full relational data model covering users, accounts/wallets, categories, budget allocations, transactions, debts, and family groups.

---

## 🔐 Security & Encryption Model

- **PIN Security**: User PINs are hashed using SHA256 combined with a per-user `Salt` and a server-side `Pepper`.
- **Asymmetric Cryptography**: Each user possesses an X25519 (Curve25519) keypair. The private key is encrypted using AES-256-GCM with a key derived from PBKDF2 (100,000 iterations).
- **Session Vault**: Decrypted private keys reside ephemerally in an in-memory session vault (RAM) with a 12-hour TTL to enable zero-knowledge cryptographic operations without persisting raw keys to the database.
