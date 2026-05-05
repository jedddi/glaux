import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = dirname(scriptDir)

const packageDistDir = join(
  projectRoot,
  "node_modules",
  "ai-edge-model-explorer-visualizer",
  "dist"
)
const mainBrowserSource = join(packageDistDir, "main_browser.js")
const workerSource = join(packageDistDir, "worker.js")
const staticSource = join(packageDistDir, "static_files")

const targetRoot = join(projectRoot, "public", "model-explorer")
const mainBrowserTarget = join(targetRoot, "main_browser.js")
const workerTarget = join(targetRoot, "worker.js")
const staticTarget = join(targetRoot, "static_files")

if (!existsSync(packageDistDir)) {
  console.warn("Model Explorer package not found; skipping asset copy.")
  process.exit(0)
}

mkdirSync(targetRoot, { recursive: true })
cpSync(mainBrowserSource, mainBrowserTarget)
cpSync(workerSource, workerTarget)
cpSync(staticSource, staticTarget, { recursive: true })

console.log("Model Explorer assets copied to public/model-explorer")
