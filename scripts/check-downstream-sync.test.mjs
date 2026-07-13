import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { checkDownstreams, compareStudioRoots } from "./check-downstream-sync.mjs";

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function createFixture({ downstreamPackage, sharedFiles = {}, templatePackage }) {
  const root = await mkdtemp(path.join(os.tmpdir(), "studio-sync-"));
  temporaryRoots.push(root);
  const template = path.join(root, "template");
  const downstream = path.join(root, "downstream");
  await Promise.all([mkdir(template), mkdir(downstream)]);
  await Promise.all([
    writeFile(path.join(template, "package.json"), JSON.stringify(templatePackage)),
    writeFile(path.join(downstream, "package.json"), JSON.stringify(downstreamPackage)),
  ]);

  for (const [relativePath, contents] of Object.entries(sharedFiles)) {
    const templatePath = path.join(template, relativePath);
    const downstreamPath = path.join(downstream, relativePath);
    await Promise.all([
      mkdir(path.dirname(templatePath), { recursive: true }),
      mkdir(path.dirname(downstreamPath), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(templatePath, contents[0]),
      writeFile(downstreamPath, contents[1]),
    ]);
  }

  return { downstream, template };
}

function packageManifest(name, scripts = {}) {
  return {
    name,
    private: true,
    version: "1.0.0",
    packageManager: "pnpm@10.33.0",
    scripts: { build: "sanity build", ...scripts },
    dependencies: { sanity: "^5.31.1" },
    devDependencies: { typescript: "^5.9.3" },
    pnpm: { overrides: { vite: "7.3.6" } },
  };
}

test("allows only package identity and template-only sync scripts to differ", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("sanity-studio-template", {
      "check:downstream-sync": "node scripts/check-downstream-sync.mjs",
      "test:downstream-sync": "node --test scripts/check-downstream-sync.test.mjs",
    }),
    downstreamPackage: packageManifest("client-studio"),
    sharedFiles: { ".npmrc": ["registry=example\n", "registry=example\n"] },
  });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), []);
});

test("compares package manifests semantically rather than by key order", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = Object.fromEntries(Object.entries(packageManifest("client")).reverse());
  const fixture = await createFixture({ templatePackage, downstreamPackage });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), []);
});

test("ignores documented client runtime configuration", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("template"),
    downstreamPackage: packageManifest("client"),
    sharedFiles: {
      "client.config.ts": [
        'export const client = "template";\n',
        'export const client = "photographer";\n',
      ],
    },
  });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), []);
});

test("does not allow template-only sync scripts to appear downstream", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("template", {
      "check:downstream-sync": "node scripts/check-downstream-sync.mjs",
    }),
    downstreamPackage: packageManifest("client", {
      "check:downstream-sync": "node a-different-script.mjs",
    }),
  });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "package.json field differs: scripts",
  ]);
});

test("reports dependency and override drift by package field", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  downstreamPackage.dependencies.sanity = "^5.32.0";
  downstreamPackage.pnpm.overrides.vite = "7.3.7";
  const fixture = await createFixture({ templatePackage, downstreamPackage });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "package.json field differs: dependencies",
    "package.json field differs: pnpm",
  ]);
});

test("reports every non-exempt package contract field", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  downstreamPackage.packageManager = "pnpm@10.34.0";
  downstreamPackage.engines = { node: ">=24" };
  downstreamPackage.scripts.build = "sanity build --different";
  downstreamPackage.devDependencies.typescript = "^6.0.0";
  const fixture = await createFixture({ templatePackage, downstreamPackage });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "package.json field differs: devDependencies",
    "package.json field differs: engines",
    "package.json field differs: packageManager",
    "package.json field differs: scripts",
  ]);
});

test("reports exact shared tooling and lockfile drift", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  const fixture = await createFixture({
    templatePackage,
    downstreamPackage,
    sharedFiles: {
      "biome.json": ["{}\n", '{"linter":true}\n'],
      ".env.example": ["SHARED_NAME=\n", "DIFFERENT_NAME=\n"],
      "pnpm-lock.yaml": ["lockfileVersion: '9.0'\n", "lockfileVersion: '9.1'\n"],
    },
  });

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "content differs: .env.example",
    "content differs: biome.json",
    "content differs: pnpm-lock.yaml",
  ]);
});

test("reports executable-mode drift for shared hooks", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  const fixture = await createFixture({
    templatePackage,
    downstreamPackage,
    sharedFiles: { ".husky/pre-push": ["pnpm check\n", "pnpm check\n"] },
  });
  await chmod(path.join(fixture.template, ".husky/pre-push"), 0o755);
  await chmod(path.join(fixture.downstream, ".husky/pre-push"), 0o644);

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "executable mode differs: .husky/pre-push",
  ]);
});

test("rejects symbolic-link substitutions in shared source", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  const fixture = await createFixture({
    templatePackage,
    downstreamPackage,
    sharedFiles: {
      "schemaTypes/shared.ts": ["export const value = true;\n", "export const value = true;\n"],
    },
  });
  const downstreamPath = path.join(fixture.downstream, "schemaTypes/shared.ts");
  await rm(downstreamPath);
  await symlink(path.join(fixture.template, "schemaTypes/shared.ts"), downstreamPath);

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "symbolic link not allowed downstream: schemaTypes/shared.ts",
  ]);
});

test("rejects a symbolic-link package manifest", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("template"),
    downstreamPackage: packageManifest("client"),
  });
  const downstreamPath = path.join(fixture.downstream, "package.json");
  await rm(downstreamPath);
  await symlink(path.join(fixture.template, "package.json"), downstreamPath);

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "symbolic link not allowed downstream: package.json",
  ]);
});

test("reports missing and unexpected files inside shared source trees", async () => {
  const templatePackage = packageManifest("template");
  const downstreamPackage = packageManifest("client");
  const fixture = await createFixture({
    templatePackage,
    downstreamPackage,
    sharedFiles: {
      "schemaTypes/missing.ts": ["export const value = true;\n", ""],
      "src/extra.ts": ["", "export const value = true;\n"],
    },
  });

  await Promise.all([
    rm(path.join(fixture.downstream, "schemaTypes/missing.ts")),
    rm(path.join(fixture.template, "src/extra.ts")),
  ]);

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "missing downstream file: schemaTypes/missing.ts",
    "unexpected downstream file: src/extra.ts",
  ]);
});

test("aggregates multiple downstream results and fails when any client drifts", async () => {
  const synchronized = await createFixture({
    templatePackage: packageManifest("template"),
    downstreamPackage: packageManifest("synchronized"),
  });
  const drifting = path.join(path.dirname(synchronized.downstream), "drifting");
  await mkdir(drifting);
  const driftingPackage = packageManifest("drifting");
  driftingPackage.dependencies.sanity = "^6.0.0";
  await writeFile(path.join(drifting, "package.json"), JSON.stringify(driftingPackage));
  const stdout = [];
  const stderr = [];

  const passed = await checkDownstreams({
    templateDirectory: synchronized.template,
    downstreamDirectories: [synchronized.downstream, drifting],
    stdout: { write: (value) => stdout.push(value) },
    stderr: { write: (value) => stderr.push(value) },
  });

  assert.equal(passed, false);
  assert.match(stdout.join(""), /downstream: shared Studio files are synchronized/);
  assert.match(stderr.join(""), /drifting: shared Studio drift detected/);
  assert.match(stderr.join(""), /package\.json field differs: dependencies/);
});

test("reports malformed package JSON instead of treating it as missing", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("template"),
    downstreamPackage: packageManifest("client"),
  });
  await writeFile(path.join(fixture.downstream, "package.json"), "{invalid");

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "invalid downstream JSON: package.json",
  ]);
});

test("reports a package manifest that is not a regular file", async () => {
  const fixture = await createFixture({
    templatePackage: packageManifest("template"),
    downstreamPackage: packageManifest("client"),
  });
  await rm(path.join(fixture.downstream, "package.json"));
  await mkdir(path.join(fixture.downstream, "package.json"));

  assert.deepEqual(await compareStudioRoots(fixture.template, fixture.downstream), [
    "downstream path is not a file: package.json",
  ]);
});
