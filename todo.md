# Project TODO

- [x] Audit command finance lokal, identitas pengirim WhatsApp, database JSON, scheduler, dan model proses bot.
- [x] Add explicit NHEfinance account-linking so a WhatsApp JID is never treated as a Google or Manus identity by itself.
- [x] Add a bot-to-NHEfinance authenticated API contract with scoped commands, replay protection, and no finance data stored in bot JSON files.
- [x] Replace local finance command writes with NHEfinance-backed income, expense, account summary, budget, goal, and report commands.
- [x] Add user-controlled finance reminders with time zone, idempotent delivery, and opt-out handling.
- [x] Add tests, security documentation, migration guidance for local finance data, and deployment instructions for the persistent bot runtime.
- [x] Use NHEfinance as the only authoritative source for linked WhatsApp finance data; prohibit mirrored JSON writes after linking.
- [x] Implement one-time link-code approval, scoped bot authentication, and revocable WhatsApp-JID-to-NHEfinance-user binding.
- [x] Preserve each inbound WhatsApp message ID as an idempotency key for synced financial writes.
- [x] Run a restart-safe automatic reminder dispatcher in the active bot runtime and acknowledge only deliveries confirmed by WhatsApp send success.
- [x] Add linked-bot commands for transfers, personal debts/receivables, debt payments, and recurring transactions using NHEfinance as source of truth.
- [x] Add executable integration coverage for the signed API link, unlink, write-idempotency, and reminder-delivery contracts.
- [ ] Verify the production deployment runbook against the configured secret, persistent runtime, restart, and failure-recovery behavior.
- [ ] Verify the Termux environment-file loading, restart command, and post-restart health check without exposing the shared service secret.
- [ ] Replace the missing Termux service secret with a newly entered value and verify it through the local health check.
- [x] Add a regression that confirms the Termux health check rejects an empty service secret.
- [x] Ensure the full bot test command exits cleanly after connection-module tests without leaving open runtime handles.
- [x] Fix the Termux configuration health-check import so it reads the exported bot config before accessing NHEfinance settings.
