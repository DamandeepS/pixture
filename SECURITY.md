# Security Policy for Pixture

## 1. Security Architecture & Threat Model

Pixture follows a **Zero-Knowledge, Local-First Security Architecture**:

* **No Remote Network Surface:** Pixture does not run backend API endpoints, microservices, or database servers that accept user photo payloads.
* **Isolated Browser Execution:** Photo processing occurs exclusively within the browser tab's sandboxed JavaScript runtime.
* **Zero External Data Exfiltration:** The application initiates no background telemetry, tracking, or network transmission of user files.

---

## 2. Supported Versions

We provide security updates and patches for the current release on the `main` branch:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability (such as a Cross-Site Scripting (XSS) risk, unintended network egress, or prototype pollution in a bundled dependency):

1. **Do not disclose the issue publicly** in an open issue or discussion forum.
2. Please report the vulnerability responsibly by opening a Private Security Advisory or emailing the maintainers with:
   * A detailed description of the vulnerability.
   * Reproduction steps or a minimal proof of concept (PoC).
   * Affected browser versions or environments.
3. We will acknowledge receipt of your report within 48 hours and work with you to patch and verify the fix prior to a public release.

---

## 4. Third-Party Dependency Audits

All dependencies used in the Pixture monorepo are scanned for known CVEs using `npm audit` and kept up-to-date with minimal runtime surface.
