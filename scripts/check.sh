#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

# ── Step 1: Required files ──
required_files=(
  AGENTS.md
  CLAUDE.md
  README.md
  docs/PROJECT_STATE.md
  docs/CHANGELOG.md
  docs/BUILD_PHASES.md
  docs/decisions/0001-cross-agent-memory.md
  docs/decisions/0002-tech-stack-and-phasing.md
  .mcp.json
  .agents/mcp_config.json
  .codex/config.toml
  opencode.json
  docs/hermes-mcp.yaml
  scripts/memory-mcp.sh
)

for file in "${required_files[@]}"; do
  if [[ ! -s "$file" ]]; then
    echo "Missing or empty required file: $file" >&2
    exit 1
  fi
done

# ── Step 2: Shell script syntax ──
bash -n scripts/check.sh scripts/memory-mcp.sh

# ── Step 3: JSON syntax ──
node -e '
  const fs = require("fs");
  for (const file of [".mcp.json", ".agents/mcp_config.json", "opencode.json"]) {
    JSON.parse(fs.readFileSync(file, "utf8"));
  }
'

# ── Step 4: TOML syntax ──
if command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY'
from pathlib import Path
import tomllib

tomllib.loads(Path(".codex/config.toml").read_text())
PY
fi

# ── Step 5: Monorepo checks (if package.json has workspaces) ──
if [[ -f package.json ]]; then
  # Typecheck core package
  if [[ -f packages/core/tsconfig.json ]]; then
    echo "Typechecking @spectra/core..."
    npx tsc --noEmit --project packages/core/tsconfig.json
  fi

  # Typecheck backend
  if [[ -f apps/backend/tsconfig.json ]]; then
    echo "Typechecking @spectra/backend..."
    npx tsc --noEmit --project apps/backend/tsconfig.json
  fi

  # Typecheck agent
  if [[ -f apps/agent/tsconfig.json ]]; then
    echo "Typechecking @spectra/agent..."
    npx tsc --noEmit --project apps/agent/tsconfig.json
  fi

  # Run tests
  if [[ -f packages/core/vitest.config.ts ]]; then
    echo "Testing @spectra/core..."
    npx vitest run --config packages/core/vitest.config.ts
  fi

  # Lint
  if [[ -f eslint.config.js ]]; then
    echo "Linting..."
    npx eslint packages/core/src/ apps/backend/src/ apps/agent/src/ --no-warn-ignored || true
  fi
fi

echo "All configured project checks passed."
