#!/usr/bin/env node
// bump-patch.js — increments app.json version PATCH and android.versionCode
// Usage: node scripts/bump-patch.js
// Run before each EAS/APK build.

const fs   = require("fs");
const path = require("path");

const APP_JSON = path.join(__dirname, "..", "app.json");

const raw  = fs.readFileSync(APP_JSON, "utf8");
const data = JSON.parse(raw);

// ── Bump PATCH ────────────────────────────────────────────────────────────────
const version = data.expo.version ?? "1.0.0";
const parts   = version.split(".").map(Number);
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`Invalid version in app.json: "${version}". Expected MAJOR.MINOR.PATCH`);
  process.exit(1);
}
parts[2] += 1; // increment PATCH only
const newVersion = parts.join(".");

// ── Bump versionCode ──────────────────────────────────────────────────────────
const currentCode = data.expo.android?.versionCode ?? 0;
const newCode     = currentCode + 1;

// ── Write back ────────────────────────────────────────────────────────────────
data.expo.version                  = newVersion;
data.expo.android                  = data.expo.android ?? {};
data.expo.android.versionCode      = newCode;

fs.writeFileSync(APP_JSON, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`✅  Version bumped: ${version} → ${newVersion}  |  versionCode: ${currentCode} → ${newCode}`);
