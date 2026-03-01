#!/bin/sh
# ---------------------------------------------------------------------------
# dev.sh — Start the full stack for local development
#
# Starts: PostgreSQL + Redis (Docker) → Backend (NestJS) → Frontend (Vite)
# Press Ctrl+C to stop everything.
# ---------------------------------------------------------------------------
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
cd "$ROOT_DIR"

# ── Colors ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { printf "${GREEN}[INFO]${NC}  %s\n" "$*"; }
warn()    { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
error()   { printf "${RED}[ERROR]${NC} %s\n" "$*"; exit 1; }
section() { printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$*"; }

# PIDs to track background processes
API_PID=""
WEB_PID=""

# ── Cleanup on exit ───────────────────────────────────────────────────
cleanup() {
  echo ""
  info "Shutting down..."

  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null && info "Frontend stopped."
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null && info "Backend stopped."

  if [ "${SKIP_DOCKER_DOWN:-}" != "1" ]; then
    $COMPOSE down --remove-orphans 2>/dev/null || true
    info "Docker containers stopped."
  fi

  exit 0
}
trap cleanup EXIT INT TERM

# ── 1. Pre-flight checks ─────────────────────────────────────────────
section "Pre-flight checks"

command -v node   >/dev/null 2>&1 || error "node is not installed. Install Node >= 20."
command -v npm    >/dev/null 2>&1 || error "npm is not installed."
command -v docker >/dev/null 2>&1 || error "docker is not installed."

if command -v docker compose >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  error "docker compose (v2) or docker-compose (v1) is required."
fi

info "node $(node -v) | npm $(npm -v) | $COMPOSE"

# ── 2. Environment file ──────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    warn ".env not found — copying from .env.example"
    cp .env.example .env
    info ".env created. Edit it to set GEMINI_API_KEY and other secrets."
  else
    warn ".env not found and no .env.example to copy from."
  fi
fi

# ── 3. Install dependencies ──────────────────────────────────────────
section "Installing dependencies"

npm install

# ── 4. Start infrastructure (PostgreSQL + Redis) ─────────────────────
section "Starting infrastructure (PostgreSQL + Redis)"

$COMPOSE up -d postgres redis
info "Waiting for PostgreSQL..."

RETRIES=30
until docker exec urban_triage_postgres pg_isready -U postgres >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  [ "$RETRIES" -le 0 ] && error "PostgreSQL did not become ready in time."
  sleep 1
done
info "PostgreSQL is ready."

# ── 5. Start backend (NestJS dev mode) ───────────────────────────────
section "Starting backend (apps/api)"

# Export DB/Redis env for local dev (host = localhost, not Docker service name)
export DB_HOST="${DB_HOST:-localhost}"
export REDIS_HOST="${REDIS_HOST:-localhost}"

# Source .env if it exists so the API picks up config
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
  # Override hosts to localhost for local dev (Docker publishes ports)
  export DB_HOST="localhost"
  export REDIS_HOST="localhost"
fi

cd apps/api
npx ts-node-dev --respawn --transpile-only src/main.ts &
API_PID=$!
cd "$ROOT_DIR"

info "Backend starting (PID $API_PID)..."

# Wait for API to be reachable
RETRIES=30
until curl -sf http://localhost:3000/api/docs >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    warn "API did not respond in time. It may still be starting..."
    break
  fi
  sleep 1
done

if [ "$RETRIES" -gt 0 ]; then
  info "Backend is ready at http://localhost:3000/api"
fi

# ── 6. Start frontend (Vite dev server) ──────────────────────────────
section "Starting frontend (apps/web)"

cd apps/web
npx vite --host &
WEB_PID=$!
cd "$ROOT_DIR"

info "Frontend starting (PID $WEB_PID)..."

# ── 7. Ready ──────────────────────────────────────────────────────────
sleep 2
echo ""
info "========================================="
info "  Full stack is running!"
info "========================================="
echo ""
info "  Frontend:  http://localhost:5173"
info "  API:       http://localhost:3000/api"
info "  Swagger:   http://localhost:3000/api/docs"
info "  DB:        localhost:5432 (urban_triage)"
info "  Redis:     localhost:6379"
echo ""
info "  Press Ctrl+C to stop everything."
echo ""

# Keep script alive, waiting for background processes
wait
