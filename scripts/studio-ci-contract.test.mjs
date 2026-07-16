import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { URL } from "node:url";

const workflowPath = new URL("../.github/workflows/studio-ci.yml", import.meta.url);
const packagePath = new URL("../package.json", import.meta.url);
const workflow = await readFile(workflowPath, "utf8");
const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));
const expectedPackageManager =
  "pnpm@10.34.5+sha512.a4ee05f2f73658255bd6a89859c065a45c28a57daefae2c893a168ee2b73168c37b91e83e57ea67654ad03f03031746430e8bce38e362e042605fb8abc80192e";

function section(startMarker, endMarker) {
  const start = workflow.indexOf(startMarker);
  assert.notEqual(start, -1, `missing workflow marker: ${startMarker}`);
  const end = workflow.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing workflow marker: ${endMarker}`);
  return workflow.slice(start, end);
}

test("keeps private-package CI behind the reviewed trust boundary", () => {
  assert.equal(
    section("on:\n", "\npermissions: {}"),
    "on:\n  pull_request:\n    branches:\n      - main\n",
  );
  assert.equal([...workflow.matchAll(/^on:/gm)].length, 1);
  assert.equal([...workflow.matchAll(/^\s*permissions:/gm)].length, 2);
  assert.equal(
    section("    env:\n", "\n    permissions:"),
    '    env:\n      COREPACK_ENABLE_PROJECT_SPEC: "1"\n      COREPACK_ENV_FILE: "0"',
  );
  assert.equal(
    section("    permissions:\n", "\n\n    steps:"),
    "    permissions:\n      contents: read\n      packages: read",
  );
  assert.match(workflow, /EVENT_ACTOR.*github\.actor/);
  assert.match(workflow, /TRIGGERING_ACTOR.*github\.triggering_actor/);
  assert.match(workflow, /HEAD_REPOSITORY.*github\.event\.pull_request\.head\.repo\.full_name/);
  assert.match(workflow, /PR_AUTHOR.*github\.event\.pull_request\.user\.login/);
  assert.match(
    workflow,
    /EVENT_ACTOR.*TRIGGERING_ACTOR.*HEAD_REPOSITORY.*PR_AUTHOR.*JessePomeroy/s,
  );
});

test("pins the hosted toolchain and avoids credential-bearing caches or artifacts", () => {
  const actionReferences = [...workflow.matchAll(/^\s+uses:\s+([^\s#]+)/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(actionReferences, [
    "actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0",
    "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e",
  ]);
  assert.match(workflow, /^ {4}runs-on: ubuntu-24\.04$/m);
  assert.match(workflow, /^ {10}node-version: "22\.23\.1"$/m);
  assert.match(workflow, /^ {10}persist-credentials: false$/m);
  assert.match(workflow, /^ {10}package-manager-cache: false$/m);
  assert.match(workflow, /^ {10}token: ""$/m);
  assert.doesNotMatch(workflow, /^\s+cache:/m);
  assert.doesNotMatch(workflow, /upload-artifact|download-artifact/);
});

test("prepares the reviewed security-fixed package manager without a registry token", () => {
  assert.equal(packageManifest.packageManager, expectedPackageManager);
  assert.equal(packageManifest.engines.pnpm, ">=10.34.5");
  const verificationStep = section(
    "      - name: Verify package manager before exposing the registry token\n",
    "\n\n      - name: Install frozen dependencies",
  );
  assert.ok(verificationStep.includes(`EXPECTED_PACKAGE_MANAGER: "${expectedPackageManager}"`));
  assert.match(verificationStep, /manifest\.packageManager/);
  assert.match(verificationStep, /corepack pnpm --version/);
  assert.doesNotMatch(verificationStep, /NODE_AUTH_TOKEN|github\.token/);
  assert.equal([...workflow.matchAll(/COREPACK_ENV_FILE/g)].length, 1);
  assert.equal([...workflow.matchAll(/COREPACK_ENABLE_PROJECT_SPEC/g)].length, 1);
});

test("limits the registry token to a hook-free, script-free frozen install", () => {
  const expressions = [...workflow.matchAll(/\$\{\{\s*([^}]+?)\s*\}\}/g)].map((match) => match[1]);
  assert.deepEqual(expressions, [
    "github.actor",
    "github.event.pull_request.head.repo.full_name",
    "github.event.pull_request.user.login",
    "github.triggering_actor",
    "github.token",
  ]);
  assert.doesNotMatch(workflow, /secrets\./);
  const expectedInstallStep = [
    "      - name: Install frozen dependencies",
    "        env:",
    `          NODE_AUTH_TOKEN: \${{ github.token }}`,
    "        run: corepack pnpm install --frozen-lockfile --ignore-pnpmfile --ignore-scripts",
  ].join("\n");
  assert.equal(
    section(
      "      - name: Install frozen dependencies\n",
      "\n\n      - name: Run full Studio check without a registry token",
    ),
    expectedInstallStep,
  );
});

test("uses a bulk-advisory-compatible security audit without changing the install manager", () => {
  assert.equal(
    packageManifest.scripts["security:audit"],
    "corepack pnpm@11.4.0 --pm-on-fail=ignore audit --audit-level low",
  );
  assert.match(packageManifest.scripts.check, /corepack pnpm run security:audit$/);
});
