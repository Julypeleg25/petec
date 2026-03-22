"use strict";

const { BASE_BRANCH, PLAN } = require("./stacked-branch-plan.data.cjs");

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

function formatItems(items) {
  return items.map((item) => `    - ${item}`).join("\n");
}

function printPlan(plan) {
  console.log(`Base branch: ${BASE_BRANCH}\n`);

  let parentBranch = BASE_BRANCH;

  for (const branchPlan of plan) {
    console.log(`Branch: ${branchPlan.branch}`);
    console.log(`Checkout from: ${parentBranch}`);
    console.log(`Command: git checkout -b ${branchPlan.branch} ${parentBranch}`);

    branchPlan.commits.forEach((commit, index) => {
      console.log(`  Commit ${index + 1}: ${commit.message}`);
      console.log("  Review items:");
      console.log(formatItems(commit.items));
      console.log("  Suggested flow:");
      console.log("    stage the listed items");
      console.log(`    git commit -m "${commit.message}"`);
    });

    console.log("");
    parentBranch = branchPlan.branch;
  }
}

function printSummary(plan) {
  const commitCount = plan.reduce(
    (total, branchPlan) => total + branchPlan.commits.length,
    0,
  );
  const itemCount = plan.reduce(
    (total, branchPlan) =>
      total +
      branchPlan.commits.reduce(
        (branchTotal, commit) => branchTotal + commit.items.length,
        0,
      ),
    0,
  );

  console.log("Summary:");
  console.log(`- Branches: ${plan.length}`);
  console.log(`- Commits: ${commitCount}`);
  console.log(`- Listed items: ${itemCount}`);
  console.log("- This script is review-only and does not run git commands.");
}

assertValidPlan(PLAN);
printPlan(PLAN);
printSummary(PLAN);
