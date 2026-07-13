import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sharedPaths = ["sanity.config.ts", "schemaTypes", "src/components"];
const downstreams = process.argv.slice(2).filter((entry) => entry !== "--");
const downstreamRoots = (
  downstreams.length > 0 ? downstreams : ["../angelsrest-studio", "../reflecting-pool-studio"]
).map((entry) => path.resolve(templateRoot, entry));

async function filesUnder(root, relativePath) {
  const absolutePath = path.join(root, relativePath);
  const info = await stat(absolutePath).catch(() => null);
  if (!info) return [];
  if (info.isFile()) return [relativePath];
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
  const files = await Promise.all(sharedPaths.map((entry) => filesUnder(root, entry)));
  return files.flat().sort();
}

const templateFiles = await sharedFiles(templateRoot);
let failed = false;

for (const downstreamRoot of downstreamRoots) {
  const downstreamFiles = await sharedFiles(downstreamRoot);
  const allFiles = [...new Set([...templateFiles, ...downstreamFiles])].sort();
  const differences = [];

  for (const relativePath of allFiles) {
    const templateContent = await readFile(path.join(templateRoot, relativePath)).catch(() => null);
    const downstreamContent = await readFile(path.join(downstreamRoot, relativePath)).catch(
      () => null,
    );
    if (!templateContent) differences.push(`unexpected downstream file: ${relativePath}`);
    else if (!downstreamContent) differences.push(`missing downstream file: ${relativePath}`);
    else if (!templateContent.equals(downstreamContent))
      differences.push(`content differs: ${relativePath}`);
  }

  const label = path.basename(downstreamRoot);
  if (differences.length === 0) {
    console.log(`${label}: shared Studio files are synchronized`);
    continue;
  }

  failed = true;
  console.error(`${label}: shared Studio drift detected`);
  for (const difference of differences) console.error(`- ${difference}`);
}

if (failed) process.exitCode = 1;
