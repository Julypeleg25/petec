"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { BASE_BRANCH, PLAN } = require("./stacked-branch-plan.data.cjs");

const SHOULD_EXECUTE = process.argv.includes("--execute");
const GIT_EXECUTABLE = resolveGitExecutable();
const CURRENT_BRANCH = getCurrentBranch();
const HAS_LOCAL_CHANGES = hasLocalChanges();

function assertValidPlan(plan) {
  const seenBranches = new Set();
  const seenItems = new Map();

  for (const branchPlan of plan) {
    if (!branchPlan.branch) {
      throw new Error("Each branch must have a branch name.");
    }

    if (seenBranches.has(branchPlan.branch)) {
      throw new Error(`Duplicate branch in plan: ${branchPlan.branch}`);
    }
    seenBranches.add(branchPlan.branch);

    for (const commit of branchPlan.commits) {
      if (!commit.message) {
        throw new Error(`Branch ${branchPlan.branch} has a commit without a message.`);
      }

      for (const item of commit.items) {
        const existingOwner = seenItems.get(item);
        if (existingOwner) {
          throw new Error(
            `Item overlap detected for "${item}" between "${existingOwner}" and "${commit.message}".`,
          );
        }
        seenItems.set(item, commit.message);
      }
    }
  }
}

function resolveGitExecutable() {
  const envCandidates = [process.env.GIT_EXE, process.env.GIT].filter(Boolean);
  const pathCandidates = ["git"];
  const installCandidates = [
    "C:\\Program Files\\Git\\cmd\\git.exe",
    "C:\\Program Files\\Git\\bin\\git.exe",
    "C:\\Program Files (x86)\\Git\\cmd\\git.exe",
    "C:\\Program Files (x86)\\Git\\bin\\git.exe",
  ];
  const candidates = [...envCandidates, ...pathCandidates, ...installCandidates];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (candidate === "git") {
      try {
        execFileSync(candidate, ["--version"], { stdio: "ignore" });
        return candidate;
      } catch {
        continue;
      }
    }

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const resolved = execFileSync("where", ["git"], { encoding: "utf8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch {}

  throw new Error(
    [
      "Git executable was not found.",
      "Set GIT_EXE to your git.exe path or install Git for Windows in a standard location.",
      "Example:",
      "  set GIT_EXE=C:\\Program Files\\Git\\cmd\\git.exe",
    ].join("\n"),
  );
}

function runGit(args) {
  execFileSync(GIT_EXECUTABLE, args, { stdio: "inherit" });
}

function runGitCapture(args) {
  return execFileSync(GIT_EXECUTABLE, args, { encoding: "utf8" }).trim();
}

function branchExists(branchName) {
  return runGitCapture(["branch", "--list", branchName]).length > 0;
}

function getCurrentBranch() {
  return runGitCapture(["branch", "--show-current"]);
}

function hasLocalChanges() {
  return runGitCapture(["status", "--short"]).length > 0;
}

function parseItemToPaths(item) {
  const separatorIndex = item.indexOf(": ");
  if (separatorIndex < 0) {
    throw new Error(`Invalid plan item format: ${item}`);
  }

  const kind = item.slice(0, separatorIndex);
  const value = item.slice(separatorIndex + 2);

  if (kind === "renamed") {
    const [fromPath, toPath] = value.split(" -> ");
    if (!fromPath || !toPath) {
      throw new Error(`Invalid renamed item: ${item}`);
    }
    return [fromPath, toPath];
  }

  return [value];
}

function getCommitPaths(commit) {
  const paths = [];

  for (const item of commit.items) {
    for (const path of parseItemToPaths(item)) {
      if (!paths.includes(path)) {
        paths.push(path);
      }
    }
  }

  return paths;
}

function assertBranchTargetsDoNotExist(plan) {
  for (const branchPlan of plan) {
    if (branchExists(branchPlan.branch)) {
      throw new Error(`Branch already exists: ${branchPlan.branch}`);
    }
  }
}

function getInitialCheckoutArgs(branchName) {
  if (HAS_LOCAL_CHANGES) {
    return ["checkout", "-b", branchName];
  }

  return ["checkout", "-b", branchName, BASE_BRANCH];
}

function printExecutionPreview(plan) {
  console.log(`Base branch: ${BASE_BRANCH}`);
  console.log(`Current branch: ${CURRENT_BRANCH || "(detached HEAD)"}`);
  console.log(
    `First branch source: ${HAS_LOCAL_CHANGES ? "current HEAD" : BASE_BRANCH}`,
  );
  console.log(`Mode: ${SHOULD_EXECUTE ? "execute" : "dry-run"}\n`);

  let isFirstBranch = true;
  let parentBranch = BASE_BRANCH;

  for (const branchPlan of plan) {
    if (isFirstBranch) {
      console.log(`git ${getInitialCheckoutArgs(branchPlan.branch).join(" ")}`);
      isFirstBranch = false;
    } else {
      console.log(`git checkout -b ${branchPlan.branch} ${parentBranch}`);
    }

    for (const commit of branchPlan.commits) {
      const paths = getCommitPaths(commit);
      console.log("git reset --quiet");
      console.log("git add -A --");
      paths.forEach((path) => console.log(`  ${path}`));
      console.log(`git commit -m "${commit.message}"`);
    }

    console.log("");
    parentBranch = branchPlan.branch;
  }

  if (!SHOULD_EXECUTE) {
    console.log("Dry-run only. Re-run with --execute to create the branches and commits.");
  }
}

function executePlan(plan) {
  let isFirstBranch = true;
  let parentBranch = BASE_BRANCH;

  for (const branchPlan of plan) {
    if (isFirstBranch) {
      runGit(getInitialCheckoutArgs(branchPlan.branch));
      isFirstBranch = false;
    } else {
      runGit(["checkout", "-b", branchPlan.branch, parentBranch]);
    }

    for (const commit of branchPlan.commits) {
      const paths = getCommitPaths(commit);
      runGit(["reset", "--quiet"]);
      runGit(["add", "-A", "--", ...paths]);
      runGit(["commit", "-m", commit.message]);
    }

    parentBranch = branchPlan.branch;
  }
}

assertValidPlan(PLAN);
printExecutionPreview(PLAN);

if (SHOULD_EXECUTE) {
  assertBranchTargetsDoNotExist(PLAN);
  executePlan(PLAN);
}
