# Dependency security risk acceptance

AI Pavilion blocks high and critical vulnerabilities in production dependencies. A development-only high finding may be temporarily accepted only through the machine-readable policy in `config/security-audit-exceptions.json`.

## GHSA-vfj7-8cjw-p6xm — braces

- Severity: high.
- Accepted scope: development-only.
- Expiration: 2026-11-15.
- Runtime exposure: not accepted.
- Reason: as of 9 October 2026 the GitHub advisory lists no patched `braces` release.
- Compensating controls: production dependencies are audited independently; the policy gate verifies that every affected installed node is marked development-only; unrelated high advisories and every critical advisory fail the build.
- Remediation: review weekly. Remove this exception when `braces` is patched, or complete the Tailwind 4 migration after CSS and browser regression testing.

This is a time-bounded risk acceptance and not a declaration that the advisory is harmless.
