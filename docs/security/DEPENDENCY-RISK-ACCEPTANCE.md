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

## GHSA-rj75-hqrm-r3gf — postcss-selector-parser

- Severity: moderate upstream; inherited Tailwind audit chains may be reported at a higher aggregate severity.
- Accepted scope: development-only.
- Expiration: 2026-11-15.
- Runtime exposure: not accepted.
- Reason: AI Pavilion parses only trusted repository CSS during the build. The upstream fix is 7.1.6, while the current Tailwind 3 toolchain constrains an older parser major.
- Remediation: migrate to Tailwind 4 and a fixed selector parser after visual/browser regression testing, then delete this exception.

