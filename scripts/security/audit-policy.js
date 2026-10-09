"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "../..");
const policy = JSON.parse(
    fs.readFileSync(path.join(root, "config/security-audit-exceptions.json"), "utf8"),
);
const lockfile = JSON.parse(
    fs.readFileSync(path.join(root, "package-lock.json"), "utf8"),
);
const exceptions = new Map(
    (policy.exceptions || []).map((entry) => [
        String(entry.id).toUpperCase(),
        entry,
    ]),
);

const audit = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["audit", "--json"],
    {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
    },
);

let report;
try {
    report = JSON.parse(audit.stdout || "{}");
} catch (error) {
    console.error("Dependency audit policy failed: invalid npm audit JSON");
    process.exit(1);
}

const vulnerabilities = report.vulnerabilities || {};
const memo = new Map();

function advisoryId(entry) {
    for (const value of [entry?.url, entry?.name, String(entry?.source || "")]) {
        const match = String(value || "").match(/GHSA-[A-Za-z0-9-]+/i);
        if (match) return match[0].toUpperCase();
    }
    return null;
}

function collectAdvisories(name, stack = new Set()) {
    if (memo.has(name)) return memo.get(name);
    if (stack.has(name)) return new Set();
    const vulnerability = vulnerabilities[name];
    if (!vulnerability) return new Set();

    const nested = new Set(stack);
    nested.add(name);
    const result = new Set();

    for (const via of vulnerability.via || []) {
        if (typeof via === "string") {
            for (const id of collectAdvisories(via, nested)) result.add(id);
        } else {
            const id = advisoryId(via);
            if (id) result.add(id);
        }
    }

    memo.set(name, result);
    return result;
}

function devOnly(vulnerability) {
    const nodes = vulnerability.nodes || [];
    return (
        nodes.length > 0 &&
        nodes.every((node) => lockfile.packages?.[node]?.dev === true)
    );
}

const rejected = [];
const accepted = [];
const now = new Date();

for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
    if (!["high", "critical"].includes(vulnerability.severity)) continue;

    if (vulnerability.severity === "critical") {
        rejected.push(`${name}: critical vulnerabilities are never excepted`);
        continue;
    }

    const ids = [...collectAdvisories(name)];
    if (ids.length === 0) {
        rejected.push(`${name}: no reviewed advisory could be traced`);
        continue;
    }
    if (!devOnly(vulnerability)) {
        rejected.push(`${name}: high vulnerability reaches a non-dev install node`);
        continue;
    }

    let allowed = true;
    for (const id of ids) {
        const exception = exceptions.get(id);
        if (!exception || exception.scope !== "dev-only") {
            rejected.push(`${name}: ${id} is not an approved dev-only exception`);
            allowed = false;
            continue;
        }
        const expiry = new Date(`${exception.expiresOn}T23:59:59Z`);
        if (!Number.isFinite(expiry.getTime()) || expiry < now) {
            rejected.push(`${name}: ${id} exception is expired`);
            allowed = false;
        }
        if (
            !exception.owner ||
            !exception.rationale ||
            !exception.remediation
        ) {
            rejected.push(`${name}: ${id} exception metadata is incomplete`);
            allowed = false;
        }
    }

    if (allowed) accepted.push({ name, ids });
}

if (rejected.length > 0) {
    rejected.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
}

accepted.forEach(({ name, ids }) =>
    console.log(`Accepted dev-only advisory chain: ${name} -> ${ids.join(", ")}`),
);
console.log("Dependency audit policy passed.");
