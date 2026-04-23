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
  { name: "GitHub token", regex: /ghp_[0-9A-Za-z]{36}/g },
  { name: "Slack token", regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
  { name: "OpenAI key", regex: /sk-[0-9A-Za-z]{20,}/g },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const getTrackedFiles = () => {
  const output = execSync("git ls-files", { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => !IGNORED_FILES.has(file));
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

const findings = [];
for (const file of getTrackedFiles()) {
  const content = readFileSafe(file);
  if (!content) continue;

  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (!matches) continue;

    for (const match of matches) {
      if (isLikelyPlaceholder(match)) continue;
      findings.push({ file, type: pattern.name, redacted: `${match.slice(0, 4)}...` });
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets found in tracked files:");
  for (const finding of findings) {
    console.error(`- ${finding.file} | ${finding.type} | ${finding.redacted}`);
  }
  process.exit(1);
}

console.log("No obvious secrets found in tracked files.");
