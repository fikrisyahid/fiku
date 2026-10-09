# Deployment Guide (Vercel & Next.js)

Fiku is a pure web-based **Next.js 16 (App Router)** application optimized for modern serverless deployment platforms such as **Vercel**.

---

## 🚀 1. Deploying to Vercel

### Quick Steps via Vercel Dashboard:
1. Import the Fiku GitHub repository in your Vercel Dashboard.
2. In the **Root Directory** setting, specify:
   ```
   main
   ```
3. The Framework Preset will automatically be detected as **Next.js**.
4. Configure the required Environment Variables (detailed in the table below).
5. Click **Deploy**.

---

## ⚙️ 2. Required Environment Variables

Ensure the following variables are configured in the Vercel Environment Variables settings:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase Session Pooler / Direct) | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres` |
| `ENCRYPTION_PEPPER` | Server secret string for cryptographic key derivation | `fana_secure_server_pepper_2026` |
| `APP_SECRET_KEY` | Master application secret key for double protection data encryption | `fana_production_secret_key_32_characters` |

---

## 🛠️ 3. Running Locally (Local Development)

```bash
# Clone and navigate to the project root
cd fana

# Install dependencies
bun install

# Copy environment variables template
cp .env.example .env

# Run database synchronization
bun run db:sync

# (Optional) Seed demo dummy data
bun run seed:dummy

# Start development server
bun run dev
```

The application will be accessible in your browser at `http://localhost:3000`.
