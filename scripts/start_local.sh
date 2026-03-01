#!/bin/sh
# ---------------------------------------------------------------------------
# start_local.sh — Install deps, build backend, start containers
# ---------------------------------------------------------------------------
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$*"; exit 1; }
section() { printf "\n${CYAN}━━━ %s ━━━${NC}\n\n" "$*"; }

# ---------------------------------------------------------------------------
# 1. Pre-flight checks
# ---------------------------------------------------------------------------
section "Pre-flight checks"

command -v node  >/dev/null 2>&1 || error "node is not installed. Install Node >= 20."
command -v npm   >/dev/null 2>&1 || error "npm is not installed."
command -v docker >/dev/null 2>&1 || error "docker is not installed."

if command -v docker compose >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  error "docker compose (v2) or docker-compose (v1) is required."
fi

info "Using: node $(node -v) | npm $(npm -v) | $COMPOSE"

# ---------------------------------------------------------------------------
# 2. Environment file
# ---------------------------------------------------------------------------
section "Environment"

if [ ! -f .env ]; then
  warn ".env not found — copying from .env.example"
  cp .env.example .env
  info ".env created. Edit it to set GEMINI_API_KEY and other secrets."
fi

# ---------------------------------------------------------------------------
# 3. Install dependencies (all workspaces)
# ---------------------------------------------------------------------------
section "Installing dependencies"

info "Installing all workspace dependencies..."
npm install

# ---------------------------------------------------------------------------
# 4. Build backend
# ---------------------------------------------------------------------------
section "Building backend (apps/api)"

npm run api:build

# ---------------------------------------------------------------------------
# 5. Run backend unit tests (quick sanity check)
# ---------------------------------------------------------------------------
section "Running backend tests"

cd apps/api
npx vitest run test/unit --reporter=dot
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# 6. Start Docker containers (backend + infra)
# ---------------------------------------------------------------------------
section "Starting Docker containers"

info "Stopping any existing containers..."
$COMPOSE down --remove-orphans 2>/dev/null || true

info "Building and starting containers..."
$COMPOSE up --build -d

# ---------------------------------------------------------------------------
# 7. Wait for services to be healthy
# ---------------------------------------------------------------------------
section "Waiting for services"

info "Waiting for PostgreSQL to accept connections..."
RETRIES=30
until docker exec urban_triage_postgres pg_isready -U postgres >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    error "PostgreSQL did not become ready in time."
  fi
  sleep 1
done
info "PostgreSQL is ready."

info "Waiting for API to respond on http://localhost:3000..."
RETRIES=30
until curl -sf http://localhost:3000/api/docs >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    warn "API did not respond in time. Check logs with: $COMPOSE logs app"
    break
  fi
  sleep 1
done

# Trap to cleanup on exit
cleanup() {
  info "Stopping Docker containers..."
  $COMPOSE down --remove-orphans 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ---------------------------------------------------------------------------
# 8. Done
# ---------------------------------------------------------------------------
echo ""
info "========================================="
info "  Project is running!"
info "========================================="
echo ""
info "  API:      http://localhost:3000/api"
info "  Swagger:  http://localhost:3000/api/docs"
info "  DB:       localhost:5432 (urban_triage)"
echo ""
info "Useful commands:"
info "  $COMPOSE logs -f app       # API logs"
info "  $COMPOSE logs -f postgres  # DB logs"
info "  $COMPOSE down              # Stop containers"
info "  npm run api:test           # Run API tests"
echo ""
