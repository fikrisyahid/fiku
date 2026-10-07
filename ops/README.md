# Operations & CI/CD

This folder contains operational configurations, CI/CD automation, and deployment assets for Cloudflare Workers.

---

## 📂 Available Files

1. **`workflow.py`**: Python-based unified task runner using `uv`, managing local development, TypeScript checks, and automatic `.env` synchronization.
2. **`pyproject.toml`**: Python package definition and dependencies for `workflow.py`.
3. **`wrangler.toml`**: Cloudflare Workers configuration for deploying Next.js and Telegram webhook endpoints to Cloudflare edge infrastructure.
4. **`ci-cd.yml`**: GitHub Actions workflow template for automated linting, type-checking, building, and deploying to Cloudflare Workers on `main` branch updates.
