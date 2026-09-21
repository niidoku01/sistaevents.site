import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const IGNORED_FILES = new Set([
  "package-lock.json",
  "bun.lockb",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const PLACEHOLDER_MARKERS = [
  "replace_with_",
  "your_",
  "example",
  "placeholder",
  "xxxxx",
  "<",
  ">",
];

const SECRET_PATTERNS = [
  { name: "Google API key", regex: /AIza[0-9A-Za-z_\-]{35}/g },
  { name: "Convex admin secret", regex: /(?:prod|preview):[A-Za-z0-9-]+\|[A-Za-z0-9+/=]+/g },
  { name: "GitHub token", regex: /ghp_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{20,}/g },
  { name: "Slack token", regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
  { name: "OpenAI key", regex: /sk-proj-[0-9A-Za-z_\-]{20,}|sk-[0-9A-Za-z]{20,}/g },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "Vercel token", regex: /\bvercel_[0-9A-Za-z]{20,}\b/g },
  { name: "Stripe live key", regex: /\bsk_live_[0-9A-Za-z]{24,}\b/g },
  { name: "Stripe restricted key", regex: /\brk_live_[0-9A-Za-z]{24,}\b/g },
  { name: "Twilio API key", regex: /\bSK[0-9a-fA-F]{32}\b/g },
  { name: "SendGrid key", regex: /\bSG\.[0-9A-Za-z\-_]{20,}\b/g },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "SMS/API bearer secret", regex: /\bBearer\s+[A-Za-z0-9_\-]{24,}\b/g },
  { name: "JWT token", regex: /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g },
  { name: "DB URL with credentials", regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^\s:@/]+:[^\s@/]+@/gi },
  { name: "Service account base64 secret", regex: /SERVICE_ACCOUNT_JSON_BASE64\s*=\s*["']?[A-Za-z0-9+/]{80,}={0,2}/g },
];

const getTrackedFiles = () => {
  const output = execSync("git ls-files", { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => !IGNORED_FILES.has(file));
};

const getStagedFiles = () => {
  try {
    const output = execSync("git diff --cached --name-only -z", { encoding: "utf8" });
    return output
      .split("\0")
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((file) => !IGNORED_FILES.has(file));
  } catch {
    return [];
  }
};

const readFileSafe = (file) => {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
};

const isLikelyPlaceholder = (match) => {
  const lower = match.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
};

const scanFile = (file, findings) => {
  const content = readFileSafe(file);
  if (!content) return;

  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (!matches) continue;

    for (const match of matches) {
      if (isLikelyPlaceholder(match)) continue;
      findings.push({ file, type: pattern.name, redacted: `${match.slice(0, 4)}...` });
    }
  }
};

const findings = [];
const scanned = new Set();
for (const file of getTrackedFiles()) {
  scanFile(file, findings);
  scanned.add(file);
}
for (const file of getStagedFiles()) {
  if (scanned.has(file)) continue;
  scanFile(file, findings);
  scanned.add(file);
}

if (findings.length > 0) {
  console.error("Potential secrets found in tracked/staged files:");
  for (const finding of findings) {
    console.error(`- ${finding.file} | ${finding.type} | ${finding.redacted}`);
  }
  process.exit(1);
}

console.log("No obvious secrets found in tracked/staged files.");