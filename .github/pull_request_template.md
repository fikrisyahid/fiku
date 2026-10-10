## Summary

<!-- Provide a brief description of the problem solved and the implementation details. -->

## Type of Change

- [ ] 🚀 **New Feature** (`feat`)
- [ ] 🐛 **Bug Fix** (`fix`)
- [ ] ⚡ **Performance Optimization** (`perf`)
- [ ] 📝 **Documentation** (`docs`)
- [ ] 🧪 **Tests** (`test`)
- [ ] 🛠️ **Refactoring / Maintenance** (`refactor` / `chore`)

## Verification & Testing

<!-- Describe the verification steps taken in your local development environment. -->
- [ ] `bun run test` (All unit & integration test suites pass without failures)
- [ ] `bun run check` (TypeScript type check passes with zero errors)
- [ ] `bun run lint` (ESLint checks pass)
- [ ] `bun run build` (Next.js production build succeeds)

## Zero-Knowledge & Security Compliance

- [ ] **No plaintext financial values** (amounts, balances, notes) are stored or leaked into the database without `X25519` + `AES-256-GCM` encryption.
- [ ] No secrets or sensitive data (API keys, peppers, private keys) are committed to the repository.

## Contributor Checklist

- [ ] Target branch for this PR is **`staging`** (not `main`).
- [ ] Commit messages follow the Conventional Commits specification (`feat:`, `fix:`, `perf:`, etc.).
- [ ] Relevant documentation in `docs/` has been updated (if schemas, commands, or behaviors changed).
