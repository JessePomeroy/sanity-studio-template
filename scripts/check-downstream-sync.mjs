import { lstat, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exactSharedPaths = [
  ".env.example",
  ".github/workflows",
  ".gitignore",
  ".husky/pre-commit",
  ".husky/pre-push",
  ".npmrc",
  "biome.json",
  "eslint.config.mjs",
  "pnpm-lock.yaml",
  "sanity-env.d.ts",
  "sanity.cli.ts",
  "sanity.config.ts",
  "schemaTypes",
  "scripts/studio-ci-contract.test.mjs",
  "src",
  "static",
  "tsconfig.json",
];
const templateOnlyScripts = new Set(["check:downstream-sync", "test:downstream-sync"]);

async function lstatOptional(absolutePath) {
  try {
    return await lstat(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function filesUnder(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const info = await lstatOptional(absolutePath);
  if (!info) return [];
  if (!info.isDirectory() || info.isSymbolicLink()) return [relativePath];
  const entries = await readdir(absolutePath, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.name !== ".DS_Store")
      .map((entry) => {
        const child = path.join(relativePath, entry.name);
        return entry.isDirectory() ? filesUnder(root, child) : [child];
      }),
  );
  return files.flat().sort();
}

async function sharedFiles(root) {
  const files = await Promise.all(exactSharedPaths.map((entry) => filesUnder(root, entry)));
  return files.flat().sort();
}

function normalizePackageManifest(manifest, { template = false } = {}) {
  const normalized = { ...manifest };
  delete normalized.name;

  if (normalized.scripts) {
    normalized.scripts = { ...normalized.scripts };
    if (template) {
      for (const script of templateOnlyScripts) delete normalized.scripts[script];
    }
  }

  return normalized;
}

async function comparePackageManifests(templateDirectory, downstreamDirectory) {
  const templatePath = path.join(templateDirectory, "package.json");
  const downstreamPath = path.join(downstreamDirectory, "package.json");
  const [templateInfo, downstreamInfo] = await Promise.all([
    lstatOptional(templatePath),
    lstatOptional(downstreamPath),
  ]);

  if (!templateInfo) return ["missing template file: package.json"];
  if (!downstreamInfo) return ["missing downstream file: package.json"];
  if (templateInfo.isSymbolicLink()) return ["symbolic link not allowed in template: package.json"];
  if (downstreamInfo.isSymbolicLink())
    return ["symbolic link not allowed downstream: package.json"];
  if (!templateInfo.isFile()) return ["template path is not a file: package.json"];
  if (!downstreamInfo.isFile()) return ["downstream path is not a file: package.json"];

  const [templateContent, downstreamContent] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(downstreamPath, "utf8"),
  ]);

  let templateManifest;
  let downstreamManifest;
  try {
    templateManifest = normalizePackageManifest(JSON.parse(templateContent), { template: true });
  } catch {
    return ["invalid template JSON: package.json"];
  }
  try {
    downstreamManifest = normalizePackageManifest(JSON.parse(downstreamContent));
  } catch {
    return ["invalid downstream JSON: package.json"];
  }

  const keys = [
    ...new Set([...Object.keys(templateManifest), ...Object.keys(downstreamManifest)]),
  ].sort();
  return keys
    .filter((key) => !isDeepStrictEqual(templateManifest[key], downstreamManifest[key]))
    .map((key) => `package.json field differs: ${key}`);
}

export async function compareStudioRoots(templateDirectory, downstreamDirectory) {
  const templateFiles = await sharedFiles(templateDirectory);
  const downstreamFiles = await sharedFiles(downstreamDirectory);
  const allFiles = [...new Set([...templateFiles, ...downstreamFiles])].sort();
  const differences = await comparePackageManifests(templateDirectory, downstreamDirectory);

  for (const relativePath of allFiles) {
    const templatePath = path.join(templateDirectory, relativePath);
    const downstreamPath = path.join(downstreamDirectory, relativePath);
    const [templateInfo, downstreamInfo] = await Promise.all([
      lstatOptional(templatePath),
      lstatOptional(downstreamPath),
    ]);
    if (!templateInfo) differences.push(`unexpected downstream file: ${relativePath}`);
    else if (!downstreamInfo) differences.push(`missing downstream file: ${relativePath}`);
    else if (templateInfo.isSymbolicLink())
      differences.push(`symbolic link not allowed in template: ${relativePath}`);
    else if (downstreamInfo.isSymbolicLink())
      differences.push(`symbolic link not allowed downstream: ${relativePath}`);
    else if (!templateInfo.isFile() || !downstreamInfo.isFile())
      differences.push(`shared path is not a regular file: ${relativePath}`);
    else {
      const [templateContent, downstreamContent] = await Promise.all([
        readFile(templatePath),
        readFile(downstreamPath),
      ]);
      if (!templateContent.equals(downstreamContent))
        differences.push(`content differs: ${relativePath}`);
      if ((templateInfo.mode & 0o111) !== (downstreamInfo.mode & 0o111))
        differences.push(`executable mode differs: ${relativePath}`);
    }
  }

  return differences;
}

export async function checkDownstreams({
  downstreamDirectories,
  stderr = process.stderr,
  stdout = process.stdout,
  templateDirectory,
}) {
  let failed = false;

  for (const downstreamDirectory of downstreamDirectories) {
    const differences = await compareStudioRoots(templateDirectory, downstreamDirectory);
    const label = path.basename(downstreamDirectory);
    if (differences.length === 0) {
      stdout.write(`${label}: shared Studio files are synchronized\n`);
      continue;
    }

    failed = true;
    stderr.write(`${label}: shared Studio drift detected\n`);
    for (const difference of differences) stderr.write(`- ${difference}\n`);
  }

  return !failed;
}

async function main() {
  const downstreams = process.argv.slice(2).filter((entry) => entry !== "--");
  const downstreamDirectories = (
    downstreams.length > 0 ? downstreams : ["../angelsrest-studio", "../reflecting-pool-studio"]
  ).map((entry) => path.resolve(templateRoot, entry));
  const passed = await checkDownstreams({
    downstreamDirectories,
    templateDirectory: templateRoot,
  });

  if (!passed) process.exitCode = 1;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) await main();
