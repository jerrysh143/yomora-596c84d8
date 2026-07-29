#!/usr/bin/env node
// Creates a zip archive of the project, excluding heavy/generated folders.
// Usage: npm run zip-code  ->  writes ./project-code.zip

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outFile = resolve(projectRoot, "project-code.zip");

const excludes = [
  "node_modules/*",
  ".git/*",
  "dist/*",
  ".output/*",
  ".nitro/*",
  ".tanstack/*",
  ".vite/*",
  ".cache/*",
  ".turbo/*",
  "coverage/*",
  "project-code.zip",
  "*.log",
];

if (existsSync(outFile)) rmSync(outFile);
mkdirSync(dirname(outFile), { recursive: true });

// Prefer `zip` if available; otherwise fall back to `tar` producing a .zip via bsdtar,
// and finally to a pure-Node implementation.
const zipCheck = spawnSync("zip", ["-v"], { stdio: "ignore" });
if (zipCheck.status === 0) {
  const args = ["-r", outFile, ".", "-x", ...excludes];
  const res = spawnSync("zip", args, { cwd: projectRoot, stdio: "inherit" });
  process.exit(res.status ?? 1);
}

// Fallback: pure Node using a minimal zip writer via built-in zlib + custom headers.
// To keep zero dependencies, we shell out to `python3` if available (widely present).
const py = spawnSync("python3", ["--version"], { stdio: "ignore" });
if (py.status === 0) {
  const script = `
import os, zipfile, fnmatch, sys
root = ${JSON.stringify(projectRoot)}
out = ${JSON.stringify(outFile)}
excludes = ${JSON.stringify(excludes)}
def excluded(rel):
    for pat in excludes:
        if fnmatch.fnmatch(rel, pat) or rel.startswith(pat.rstrip("/*")):
            return True
    return False
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for base, dirs, files in os.walk(root):
        rel_base = os.path.relpath(base, root).replace(os.sep, "/")
        dirs[:] = [d for d in dirs if not excluded((rel_base + "/" + d).lstrip("./") + "/")]
        for f in files:
            rel = os.path.normpath(os.path.join(rel_base, f)).replace(os.sep, "/")
            if rel.startswith("./"): rel = rel[2:]
            if excluded(rel): continue
            z.write(os.path.join(base, f), rel)
print("Wrote", out)
`;
  const res = spawnSync("python3", ["-c", script], { stdio: "inherit" });
  process.exit(res.status ?? 1);
}

console.error(
  "Neither `zip` nor `python3` is available. Install `zip` (e.g. `apt install zip` / `brew install zip`) and re-run `npm run zip-code`.",
);
process.exit(1);