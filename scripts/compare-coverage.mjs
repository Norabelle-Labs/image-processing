#!/usr/bin/env node
/**
 * Compare Istanbul coverage between a baseline and current run, fail on any regression.
 *
 * Usage:
 *   node scripts/compare-coverage.mjs --baseline ./__baseline/coverage --current ./coverage [--epsilon 0.1]
 *
 * The script reads either coverage-summary.json or coverage-final.json and computes totals.
 * It fails (exit code 1) if any of statements, branches, functions, or lines percentages drop
 * by more than the epsilon (default 0.1%).
 */
import fs from "node:fs";
import path from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { baseline: null, current: null, epsilon: 0.1 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--baseline") opts.baseline = args[++i];
    else if (a === "--current") opts.current = args[++i];
    else if (a === "--epsilon") opts.epsilon = Number(args[++i]);
  }
  if (!opts.baseline || !opts.current) {
    console.error("Missing --baseline or --current path");
    process.exit(2);
  }
  return opts;
}

function readCoverageTotals(dir) {
  const summaryPath = path.join(dir, "coverage-summary.json");
  if (fs.existsSync(summaryPath)) {
    const data = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    return data.total;
  }
  const finalPath = path.join(dir, "coverage-final.json");
  if (fs.existsSync(finalPath)) {
    const data = JSON.parse(fs.readFileSync(finalPath, "utf8"));
    // Compute totals from files
    const totals = {
      lines: { total: 0, covered: 0, pct: 0 },
      statements: { total: 0, covered: 0, pct: 0 },
      functions: { total: 0, covered: 0, pct: 0 },
      branches: { total: 0, covered: 0, pct: 0 },
    };
    for (const file of Object.values(data)) {
      const f = file;
      const add = (key, totalKey = "total", coveredKey = "covered") => {
        if (!f[key]) return;
        totals[key].total += f[key][totalKey] ?? 0;
        totals[key].covered += f[key][coveredKey] ?? 0;
      };
      add("lines");
      add("statements");
      add("functions");
      add("branches");
    }
    for (const key of Object.keys(totals)) {
      const k = key;
      totals[k].pct = totals[k].total ? (totals[k].covered / totals[k].total) * 100 : 100;
    }
    return totals;
  }
  return null;
}

function fmtPct(n) {
  return `${n.toFixed(2)}%`;
}

(function main() {
  const { baseline, current, epsilon } = parseArgs();
  const baseTotals = readCoverageTotals(baseline);
  const currTotals = readCoverageTotals(current);

  if (!currTotals) {
    console.error(`Current coverage not found in ${current}`);
    process.exit(2);
  }
  if (!baseTotals) {
    console.warn(`Baseline coverage not found in ${baseline}. Skipping regression comparison.`);
    process.exit(0);
  }

  const keys = ["statements", "branches", "functions", "lines"];
  let failed = false;
  for (const k of keys) {
    const base = baseTotals[k]?.pct ?? 0;
    const curr = currTotals[k]?.pct ?? 0;
    const drop = base - curr;
    if (drop > epsilon) {
      failed = true;
      console.error(`Coverage regression for ${k}: ${fmtPct(base)} -> ${fmtPct(curr)} (drop ${fmtPct(drop)})`);
    } else {
      console.log(`Coverage OK for ${k}: ${fmtPct(base)} -> ${fmtPct(curr)} (≤ ${epsilon}%)`);
    }
  }

  if (failed) process.exit(1);
  console.log("Coverage comparison passed.");
})();
