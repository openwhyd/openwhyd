# Copilot coding agent instructions

- Dependencies are preinstalled by `.github/workflows/copilot-setup-steps.yml`; don't reinstall unless `package.json` changed.
- Keep command execution minimal and non-redundant. Don't repeat `git status`/`git diff`/`npm ls` without a change in between.
- For dependency-only changes, run `npm ci` and the relevant targeted tests (e.g. `npm run test:unit`) once, and skip extra review/security scans.
- Call `report_progress` only when there are new changes to commit; avoid repeated no-op updates.
- Do not upgrade `@cypress/code-coverage` to major 4 while Cypress remains 13.x (v4 requires a newer Cypress).
- Keep responses concise; avoid long no-op verification sequences.
