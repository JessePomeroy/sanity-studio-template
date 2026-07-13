import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { URL } from "node:url";

const configPath = new URL("../sanity.config.ts", import.meta.url);
const config = await readFile(configPath, "utf8");
const legacySingletonTypes = ["about", "contactPage", "siteSettings"];

test("keeps legacy singleton desk entries on existing document lists", () => {
  for (const schemaType of legacySingletonTypes) {
    assert.match(
      config,
      new RegExp(`S\\.documentTypeList\\("${schemaType}"\\)`),
      `${schemaType} must keep resolving existing generated document IDs`,
    );
    assert.doesNotMatch(
      config,
      new RegExp(`\\.documentId\\("${schemaType}"\\)`),
      `${schemaType} requires an explicit content migration before using a fixed ID`,
    );
  }
});
