import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pnpmRoot = path.join(root, "node_modules", ".pnpm");

if (!fs.existsSync(pnpmRoot)) {
  process.exit(0);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function ensureLink(source, dest) {
  if (!fs.existsSync(source)) return false;
  if (fs.existsSync(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.symlinkSync(source, dest, "junction");
  return true;
}

let packageCount = 0;
let linkCount = 0;
const entries = fs.readdirSync(pnpmRoot).filter((name) => name !== "node_modules");

for (const entry of entries) {
  const base = path.join(pnpmRoot, entry, "node_modules");
  if (!fs.existsSync(base)) continue;

  const packageDirs = [];
  for (const child of fs.readdirSync(base)) {
    const childPath = path.join(base, child);
    if (child.startsWith("@")) {
      if (!fs.statSync(childPath).isDirectory()) continue;
      for (const scoped of fs.readdirSync(childPath)) {
        const scopedPath = path.join(childPath, scoped);
        if (fs.existsSync(path.join(scopedPath, "package.json"))) {
          packageDirs.push(scopedPath);
        }
      }
      continue;
    }
    if (fs.existsSync(path.join(childPath, "package.json"))) {
      packageDirs.push(childPath);
    }
  }

  for (const pkgDir of packageDirs) {
    const pkg = readJson(path.join(pkgDir, "package.json"));
    if (!pkg) continue;
    packageCount += 1;

    const deps = {
      ...(pkg.dependencies || {}),
      ...(pkg.optionalDependencies || {}),
      ...(pkg.peerDependencies || {}),
    };

    const nestedNodeModules = path.join(pkgDir, "node_modules");
    for (const dep of Object.keys(deps)) {
      const source = path.join(root, "node_modules", dep);
      const dest = path.join(nestedNodeModules, dep);
      if (ensureLink(source, dest)) linkCount += 1;
    }
  }
}

console.log(`[fix-pnpm-metro-links] scanned ${packageCount} packages, added ${linkCount} links`);
