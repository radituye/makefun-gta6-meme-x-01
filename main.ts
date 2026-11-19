// main.ts — GTA 6 meme entry for make.fun competition gta6-meme-x-01.
// The grader runs this as `node main.ts` (node22, no network, read-only repo).
// It reads POST.json (the X post link) and meme.jpg, validates the entry,
// and writes a deterministic report to the output directory.
// Uses only Node.js built-ins. No network, no wall clock, no randomness,
// so two runs on the same files produce the same report.

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// The exact draft text of the X post that carries this meme.
// It must name make.fun (a link) and one of the entrant's play codes.
const DRAFT_POST = [
  "Me: I'll play GTA VI for just 30 minutes.",
  "",
  "Also me, 9 hours later: owns a nightclub in Vice City. 😂",
  "",
  "GTA VI has taken over my life and I'm not even mad. @makefunai https://make.fun/bounty/gta6-meme-x-01",
  "makefun-mammoth-crane-river",
].join("\n");

const PLAY_CODE = "makefun-mammoth-crane-river";
const MEME_FILE = "meme.jpg";
const POST_FILE = "POST.json";
const HANDLE = "Praselliora";

function repoDir() {
  return __dirname;
}

function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR || path.join(repoDir(), "output");
}

function readPostLink() {
  const raw = fs.readFileSync(path.join(repoDir(), POST_FILE), "utf8");
  const data = JSON.parse(raw);
  if (typeof data.url !== "string" || data.url.length === 0) {
    throw new Error("POST.json has no url string");
  }
  return data.url;
}

function postUrlIsValid(url) {
  const pattern = /^https:\/\/(x\.com|twitter\.com)\/Praselliora\/status\/\d+$/;
  return pattern.test(url);
}

function hashMeme() {
  const bytes = fs.readFileSync(path.join(repoDir(), MEME_FILE));
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error(MEME_FILE + " is not a JPEG file");
  }
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
  return { bytes: bytes.length, sha256 };
}

function draftIsValid() {
  const problems = [];
  if (!DRAFT_POST.includes("make.fun")) {
    problems.push("draft post does not mention make.fun");
  }
  if (!DRAFT_POST.includes(PLAY_CODE)) {
    problems.push("draft post does not carry the play code");
  }
  if (DRAFT_POST.length > 280) {
    problems.push("draft post is longer than 280 characters");
  }
  return problems;
}

function main() {
  const report = {
    competition: "gta6-meme-x-01",
    handle: HANDLE,
    meme: null,
    postUrl: null,
    postUrlValid: false,
    draft: DRAFT_POST,
    draftChars: DRAFT_POST.length,
    draftProblems: [],
    valid: false,
  };

  const failures = [];

  try {
    const url = readPostLink();
    report.postUrl = url;
    report.postUrlValid = postUrlIsValid(url);
    if (!report.postUrlValid) {
      failures.push("POST.json url is not a public X post link for @" + HANDLE);
    }
  } catch (err) {
    failures.push("could not read POST.json: " + err.message);
  }

  try {
    report.meme = hashMeme();
  } catch (err) {
    failures.push("could not read " + MEME_FILE + ": " + err.message);
  }

  report.draftProblems = draftIsValid();
  failures.push(...report.draftProblems);

  report.valid = failures.length === 0;
  report.failures = failures;

  const outDir = outputDir();
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "entry-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  if (report.valid) {
    console.log("entry valid: post " + report.postUrl);
    console.log("meme " + MEME_FILE + ": " + report.meme.bytes + " bytes, sha256 " + report.meme.sha256);
    console.log("report written to " + outPath);
  } else {
    console.log("entry NOT valid:");
    for (const failure of failures) {
      console.log("- " + failure);
    }
    console.log("report written to " + outPath);
    process.exitCode = 1;
  }
}

main();
