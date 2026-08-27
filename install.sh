#!/usr/bin/env bash
set -e

# ==============================================================================
# 🌿 ZenRouter Official Installer — Zero-Config
# https://github.com/ZenRouter/ZenRouter
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/ZenRouter/ZenRouter/master/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/ZenRouter/ZenRouter/master/install.sh | bash -s -- --dir ~/.zenrouter/app --branch master
#
# Options:
#   --dir PATH      Custom install directory (default: ~/.zenrouter/app for source fallback)
#   --branch NAME   Git branch to clone (default: master)
#   --help          Show help
#   --no-build      Skip npm build step when using source fallback
#   --skip-deps     Skip system dependency auto-install
#
# Features (inspired by hermes-agent zero-config):
#   - Auto-detects OS/arch, handles Linux/macOS/WSL/Termux
#   - Auto-installs missing deps: git, curl, Node.js (>=18), build tools
#   - Managed Node fallback (downloads official tarball to ~/.zenrouter/node if system Node is too old)
#   - Non-interactive safe (curl | bash), handles sudo gracefully
#   - Idempotent: re-runs update existing installs
# ==============================================================================

# Guard against env leakage (like hermes)
if [ -n "${PYTHONPATH:-}" ]; then unset PYTHONPATH; fi
if [ -n "${NODE_PATH:-}" ] && [[ "$NODE_PATH" == *".hermes"* ]]; then unset NODE_PATH; fi

# Colors
BOLD="\033[1m"
GREEN="\033[38;2;85;219;156m"
BLUE="\033[38;2;75;114;164m"
CYAN="\033[38;2;77;162;255m"
CORAL="\033[38;2;232;93;63m"
YELLOW="\033[38;2;255;215;49m"
GRAY="\033[38;2;148;163;184m"
RED="\033[38;2;248;113;113m"
RESET="\033[0m"

# Configuration
REPO_URL="https://github.com/ZenRouter/ZenRouter.git"
ZENROUTER_HOME="${ZENROUTER_HOME:-$HOME/.zenrouter}"
INSTALL_DIR=""
INSTALL_DIR_EXPLICIT=false
BRANCH="master"
SKIP_BUILD=false
SKIP_DEPS=false
NODE_VERSION="22"
MIN_NODE_MAJOR=18

if [ -n "${ZENROUTER_INSTALL_DIR:-}" ]; then
  INSTALL_DIR="$ZENROUTER_INSTALL_DIR"
  INSTALL_DIR_EXPLICIT=true
fi

# Detect non-interactive (curl | bash)
if [ -t 0 ]; then IS_INTERACTIVE=true; else IS_INTERACTIVE=false; fi

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; INSTALL_DIR_EXPLICIT=true; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --no-build) SKIP_BUILD=true; shift ;;
    --skip-deps) SKIP_DEPS=true; shift ;;
    -h|--help)
      echo "ZenRouter Installer"
      echo ""
      echo "Usage: install.sh [OPTIONS]"
      echo "  --dir PATH     Install directory for source fallback (default: ~/.zenrouter/app)"
      echo "  --branch NAME  Git branch (default: master)"
      echo "  --no-build     Skip build step"
      echo "  --skip-deps    Skip system dependency auto-install"
      echo "  -h, --help     Show help"
      exit 0
      ;;
    *) echo -e "${YELLOW}Unknown option: $1${RESET}"; exit 1 ;;
  esac
done

# Helpers
log_info()    { echo -e "${CYAN}→${RESET} $1"; }
log_success() { echo -e "${GREEN}✓${RESET} $1"; }
log_warn()    { echo -e "${YELLOW}⚠${RESET} $1"; }
log_error()   { echo -e "${RED}✗${RESET} $1"; }
log_step()    { echo -e "${BLUE}▸${RESET} ${BOLD}$1${RESET}"; }

prompt_yes_no() {
  local q="$1" def="${2:-yes}" ans="" suffix="[Y/n]"
  case "$def" in [nN]*) suffix="[y/N]";; esac
  if [ "$IS_INTERACTIVE" = true ]; then
    read -r -p "$q $suffix " ans || ans=""
  elif [ -r /dev/tty ] && [ -w /dev/tty ]; then
    printf "%s %s " "$q" "$suffix" > /dev/tty
    IFS= read -r ans < /dev/tty || ans=""
  else
    ans=""
  fi
  ans="${ans#"${ans%%[![:space:]]*}"}"; ans="${ans%"${ans##*[![:space:]]}"}"
  if [ -z "$ans" ]; then case "$def" in [yY]*) return 0;; *) return 1;; esac; fi
  case "$ans" in [yY]|[yY][eE][sS]) return 0;; *) return 1;; esac
}

is_termux() { [ -n "${TERMUX_VERSION:-}" ] || [[ "${PREFIX:-}" == *"com.termux/files/usr"* ]]; }
is_wsl() { grep -qi microsoft /proc/version 2>/dev/null || [ -n "${WSL_DISTRO_NAME:-}" ]; }

# Resolve install layout
resolve_install_layout() {
  if [ "$INSTALL_DIR_EXPLICIT" = true ]; then
    log_info "Install dir: $INSTALL_DIR (explicit)"
    return 0
  fi
  INSTALL_DIR="$ZENROUTER_HOME/app"
}

get_link_dir() {
  if is_termux && [ -n "${PREFIX:-}" ]; then echo "$PREFIX/bin"
  elif [ "$(id -u 2>/dev/null || echo 1000)" -eq 0 ] && [ -d "/usr/local/bin" ]; then echo "/usr/local/bin"
  else echo "$HOME/.local/bin"
  fi
}

# Banner
print_banner() {
  echo -e "${BLUE}"
  echo "  ______           ____             __       "
  echo " /__  / ___  ____ / __ \____  __  __/ /____  "
  echo "   / / / _ \/ __ \/ /_/ / __ \/ / / / __/ _ \ "
  echo "  / /_/  __/ / / / _, _/ /_/ / /_/ / /_/  __/ "
  echo " /____|___/_/ /_/_/ |_|\____/\__,_/\__/\___/  "
  echo -e "${RESET}"
  echo -e "${CORAL}${BOLD} 🌿 ZenRouter — Serene AI Gateway & Intelligent Routing Engine${RESET}"
  echo -e "${GRAY} https://github.com/ZenRouter/ZenRouter${RESET}"
  echo ""
}

# OS detection
detect_os() {
  local uname_s
  uname_s="$(uname -s)"
  case "$uname_s" in
    Linux*)
      if is_termux; then OS="android"; DISTRO="termux"
      else
        OS="linux"
        if [ -f /etc/os-release ]; then . /etc/os-release; DISTRO="$ID"; DISTRO_VERSION="${VERSION_ID:-}"; else DISTRO="unknown"; fi
      fi
      ;;
    Darwin*) OS="macos"; DISTRO="macos" ;;
    CYGWIN*|MINGW*|MSYS*) OS="windows"; DISTRO="windows" ;;
    *) OS="unknown"; DISTRO="unknown" ;;
  esac
  ARCH="$(uname -m)"
  case "$ARCH" in x86_64) ARCH_NICE="x64";; aarch64|arm64) ARCH_NICE="arm64";; armv7l) ARCH_NICE="armv7l";; *) ARCH_NICE="$ARCH";; esac
  log_success "Detected: ${OS}/${DISTRO} (${ARCH})"
  if [ "$OS" = "windows" ]; then
    log_warn "Native Windows detected — WSL2 or Docker is strongly recommended."
    log_info "  WSL: wsl --install"
    log_info "  Docker: docker run -p 20128:20128 joyccn/zenrouter"
  fi
  if is_wsl; then log_info "WSL detected — using Linux flow"; fi
}

# Network check
check_network() {
  if ! command -v curl >/dev/null 2>&1; then return 0; fi
  log_info "Checking connectivity..."
  local ok=true
  for url in "https://registry.npmjs.org/" "https://github.com/" "https://nodejs.org/dist/"; do
    if ! curl -fsSI --max-time 8 "$url" >/dev/null 2>&1; then
      log_warn "Cannot reach $url"; ok=false
    fi
  done
  if [ "$ok" = true ]; then log_success "Network OK"; else log_warn "Some hosts unreachable — install may fail, check proxy/DNS"; fi
}

# Check curl
ensure_curl() {
  if command -v curl >/dev/null 2>&1; then return 0; fi
  log_warn "curl not found — required for downloads"
  if [ "$SKIP_DEPS" = true ]; then log_error "curl missing and --skip-deps set"; exit 1; fi
  local sudo_cmd=""; [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
  case "$DISTRO" in
    ubuntu|debian) $sudo_cmd apt-get update -qq && $sudo_cmd apt-get install -y -qq curl || true ;;
    fedora) $sudo_cmd dnf install -y curl || true ;;
    arch) $sudo_cmd pacman -S --noconfirm curl || true ;;
    termux) pkg install -y curl || true ;;
    macos) command -v brew >/dev/null 2>&1 && brew install curl || true ;;
  esac
  command -v curl >/dev/null 2>&1 || { log_error "curl still missing — install manually"; exit 1; }
  log_success "curl installed"
}

# Git
attempt_install_git() {
  log_info "Attempting to install git..."
  local sudo_cmd=""; [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
  case "$OS" in
    macos)
      if command -v brew >/dev/null 2>&1; then brew install git >/dev/null 2>&1 || true; command -v git >/dev/null 2>&1 && return 0; fi
      if command -v xcode-select >/dev/null 2>&1; then
        log_info "Requesting Xcode Command Line Tools (provides git)..."
        xcode-select --install >/dev/null 2>&1 || true
        local waited=0; while [ $waited -lt 300 ]; do command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1 && return 0; sleep 5; waited=$((waited+5)); done
      fi
      return 1
      ;;
    linux|android)
      case "$DISTRO" in
        ubuntu|debian) $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null 2>&1 || true; $sudo_cmd apt-get install -y -qq git >/dev/null 2>&1 || true ;;
        fedora) $sudo_cmd dnf install -y git >/dev/null 2>&1 || true ;;
        arch) $sudo_cmd pacman -S --noconfirm git >/dev/null 2>&1 || true ;;
        termux) pkg install -y git >/dev/null 2>&1 || true ;;
        *) return 1 ;;
      esac
      command -v git >/dev/null 2>&1 && return 0; return 1
      ;;
    *) return 1 ;;
  esac
}

check_git() {
  log_step "Checking git"
  if command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1; then log_success "git $(git --version | awk '{print $3}') found"; return 0; fi
  log_warn "git not found"
  if [ "$SKIP_DEPS" = true ]; then log_error "git required for source fallback"; return 1; fi
  if attempt_install_git; then log_success "git $(git --version | awk '{print $3}') installed"; return 0; fi
  log_warn "Could not auto-install git"
  case "$OS" in
    linux) case "$DISTRO" in ubuntu|debian) log_info "  sudo apt install git";; fedora) log_info "  sudo dnf install git";; arch) log_info "  sudo pacman -S git";; esac ;;
    macos) log_info "  xcode-select --install  # or brew install git" ;;
    android) log_info "  pkg install git" ;;
  esac
  return 1
}

# Node helpers
node_satisfies() {
  local ver="${1#v}"; local major="${ver%%.*}"
  case "$major" in ''|*[!0-9]*) return 1;; esac
  [ "$major" -ge "$MIN_NODE_MAJOR" ]
}

configure_managed_npm_prefix() {
  [ -x "$ZENROUTER_HOME/node/bin/npm" ] || return 0
  local link_dir; link_dir="$(get_link_dir)"
  mkdir -p "$ZENROUTER_HOME/node/etc"
  printf 'prefix=%s\n' "$(dirname "$link_dir")" > "$ZENROUTER_HOME/node/etc/npmrc"
}

install_managed_node() {
  if [ "$DISTRO" = "termux" ]; then
    log_info "Installing Node.js via pkg (Termux)..."
    pkg install -y nodejs >/dev/null 2>&1 && log_success "Node $(node --version 2>/dev/null) via pkg" && return 0
    log_warn "pkg install nodejs failed"; return 1
  fi
  local node_os node_arch
  case "$OS" in linux) node_os="linux";; macos) node_os="darwin";; *) log_warn "Unsupported OS for managed Node"; return 1;; esac
  case "$ARCH" in x86_64) node_arch="x64";; arm64|aarch64) node_arch="arm64";; armv7l) node_arch="armv7l";; *) log_warn "Unsupported arch $ARCH for Node"; return 1;; esac

  local index_url="https://nodejs.org/dist/latest-v${NODE_VERSION}.x/"
  local tarball=""
  log_info "Resolving Node.js v${NODE_VERSION} tarball (${node_os}-${node_arch})..."
  tarball=$(curl -fsSL "$index_url" | grep -oE "node-v${NODE_VERSION}\.[0-9]+\.[0-9]+-${node_os}-${node_arch}\.tar\.(xz|gz)" | head -1 || true)
  if [ -z "$tarball" ]; then log_warn "Could not find Node $NODE_VERSION tarball at $index_url"; return 1; fi
  local url="${index_url}${tarball}"
  local tmp; tmp=$(mktemp -d 2>/dev/null || echo "/tmp/zenrouter-node-$$")
  log_info "Downloading $tarball..."
  if ! curl -fsSL "$url" -o "$tmp/$tarball"; then log_warn "Download failed: $url"; rm -rf "$tmp"; return 1; fi
  log_info "Extracting to $ZENROUTER_HOME/node..."
  if [[ "$tarball" == *.tar.xz ]]; then tar -xf "$tmp/$tarball" -C "$tmp"; else tar -xzf "$tmp/$tarball" -C "$tmp"; fi
  local extracted; extracted=$(ls -d "$tmp"/node-v* 2>/dev/null | head -1)
  if [ ! -d "$extracted" ]; then log_warn "Extraction failed"; rm -rf "$tmp"; return 1; fi
  rm -rf "$ZENROUTER_HOME/node"
  mkdir -p "$ZENROUTER_HOME"
  mv "$extracted" "$ZENROUTER_HOME/node"
  rm -rf "$tmp"
  local link_dir; link_dir="$(get_link_dir)"; mkdir -p "$link_dir"
  ln -sf "$ZENROUTER_HOME/node/bin/node" "$link_dir/node"
  ln -sf "$ZENROUTER_HOME/node/bin/npm" "$link_dir/npm"
  ln -sf "$ZENROUTER_HOME/node/bin/npx" "$link_dir/npx"
  configure_managed_npm_prefix
  export PATH="$ZENROUTER_HOME/node/bin:$PATH"
  export PATH="$link_dir:$PATH"
  log_success "Managed Node $(node --version) installed to $ZENROUTER_HOME/node"
  return 0
}

check_node() {
  log_step "Checking Node.js (>=${MIN_NODE_MAJOR}) / Bun"
  configure_managed_npm_prefix

  # Prefer existing system node if good
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    local ver; ver=$(node --version 2>/dev/null || echo "v0")
    if node_satisfies "$ver"; then
      log_success "Node $ver found ($(command -v node)) — npm $(npm --version 2>/dev/null)"
      return 0
    fi
    log_warn "Node $ver too old (need >=${MIN_NODE_MAJOR})"
  elif command -v node >/dev/null 2>&1 && ! command -v npm >/dev/null 2>&1; then
    log_warn "node found but npm missing — broken install"
  fi

  # Check managed node
  if [ -x "$ZENROUTER_HOME/node/bin/node" ] && [ -x "$ZENROUTER_HOME/node/bin/npm" ]; then
    local mver; mver=$("$ZENROUTER_HOME/node/bin/node" --version 2>/dev/null || echo "v0")
    if node_satisfies "$mver"; then
      export PATH="$ZENROUTER_HOME/node/bin:$PATH"
      export PATH="$(get_link_dir):$PATH"
      log_success "Managed Node $mver found ($ZENROUTER_HOME/node) "
      return 0
    fi
  fi

  # Check Bun as alternative (can run zenrouter but npm needed for global install)
  if command -v bun >/dev/null 2>&1; then
    log_info "Bun $(bun --version 2>/dev/null) found — can run ZenRouter, but Node is preferred for npm global"
    # Still try to get Node for npm global path; Bun can be fallback
  fi

  if [ "$SKIP_DEPS" = true ]; then
    log_warn "Node not found and --skip-deps set — will try Bun fallback"
    return 1
  fi

  log_info "Installing Node.js v${NODE_VERSION}..."

  # Try package managers first (faster, integrates with OS)
  local sudo_cmd=""; [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"

  if command -v brew >/dev/null 2>&1; then
    log_info "Trying brew install node@${NODE_VERSION}..."
    if brew install node@${NODE_VERSION} >/dev/null 2>&1 || brew install node >/dev/null 2>&1; then
      if command -v node >/dev/null 2>&1 && node_satisfies "$(node --version)"; then log_success "Node $(node --version) via brew"; return 0; fi
    fi
  fi

  case "$DISTRO" in
    ubuntu|debian)
      if command -v apt-get >/dev/null 2>&1; then
        log_info "Trying apt NodeSource..."
        if [ -n "$sudo_cmd" ] || [ "$(id -u)" -eq 0 ]; then
          curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | $sudo_cmd -E bash - >/dev/null 2>&1 || true
          $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs >/dev/null 2>&1 || true
          if command -v node >/dev/null 2>&1 && node_satisfies "$(node --version 2>/dev/null || echo v0)"; then log_success "Node $(node --version) via apt"; return 0; fi
        fi
      fi
      ;;
    fedora)
      if command -v dnf >/dev/null 2>&1; then
        $sudo_cmd dnf install -y nodejs npm >/dev/null 2>&1 || true
        if command -v node >/dev/null 2>&1 && node_satisfies "$(node --version 2>/dev/null || echo v0)"; then log_success "Node $(node --version) via dnf"; return 0; fi
      fi
      ;;
    arch)
      if command -v pacman >/dev/null 2>&1; then
        $sudo_cmd pacman -S --noconfirm nodejs npm >/dev/null 2>&1 || true
        if command -v node >/dev/null 2>&1 && node_satisfies "$(node --version 2>/dev/null || echo v0)"; then log_success "Node $(node --version) via pacman"; return 0; fi
      fi
      ;;
  esac

  # Fallback: managed tarball
  if install_managed_node; then return 0; fi

  # Ultimate fallback: Bun
  if command -v bun >/dev/null 2>&1; then
    log_warn "Node install failed, but Bun is available — will use Bun"
    return 0
  fi
  log_info "Trying Bun as runtime fallback..."
  if curl -fsSL https://bun.sh/install | bash >/dev/null 2>&1; then
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    if command -v bun >/dev/null 2>&1; then log_success "Bun $(bun --version) installed"; return 0; fi
  fi

  log_error "Failed to install Node.js or Bun. Install Node >=${MIN_NODE_MAJOR} manually: https://nodejs.org/"
  return 1
}

check_build_tools() {
  log_step "Checking build tools (for better-sqlite3 — optional, sql.js fallback exists)"
  local missing=()
  if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then missing+=("python3"); fi
  if ! command -v make >/dev/null 2>&1 && ! command -v gmake >/dev/null 2>&1; then missing+=("make"); fi
  if ! command -v g++ >/dev/null 2>&1 && ! command -v clang++ >/dev/null 2>&1; then missing+=("g++"); fi
  if [ ${#missing[@]} -eq 0 ]; then log_success "Build tools OK"; return 0; fi
  log_warn "Missing: ${missing[*]} (only needed if you want better-sqlite3; otherwise sql.js fallback works)"
  if [ "$SKIP_DEPS" = true ]; then return 0; fi
  local sudo_cmd=""; [ "$(id -u 2>/dev/null || echo 1000)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && sudo_cmd="sudo"
  log_info "Attempting to install build tools..."
  case "$DISTRO" in
    ubuntu|debian) $sudo_cmd env DEBIAN_FRONTEND=noninteractive apt-get update -qq >/dev/null 2>&1 || true; $sudo_cmd apt-get install -y -qq build-essential python3 >/dev/null 2>&1 || true ;;
    fedora) $sudo_cmd dnf install -y gcc-c++ make python3 >/dev/null 2>&1 || true ;;
    arch) $sudo_cmd pacman -S --noconfirm base-devel python >/dev/null 2>&1 || true ;;
    termux) pkg install -y clang make python pkg-config libffi openssl >/dev/null 2>&1 || true ;;
    macos) 
      if command -v xcode-select >/dev/null 2>&1; then
        log_info "macOS: ensure Xcode CLI tools are installed (xcode-select --install) for native builds"
      fi
      ;;
  esac
  # Re-check silently, don't fail hard
  if command -v g++ >/dev/null 2>&1 || command -v clang++ >/dev/null 2>&1; then log_success "Build tools now available"; else log_warn "Build tools still missing — will use sql.js fallback"; fi
}

# Install zenrouter via npm
install_via_npm() {
  log_step "Installing ZenRouter CLI via npm"
  local npm_cmd="npm"
  if command -v npm >/dev/null 2>&1; then npm_cmd="npm"
  elif [ -x "$ZENROUTER_HOME/node/bin/npm" ]; then npm_cmd="$ZENROUTER_HOME/node/bin/npm"
  elif command -v bun >/dev/null 2>&1; then
    log_info "npm not found, trying bun..."
    if bun add -g zenrouter >/dev/null 2>&1; then log_success "Installed via bun"; return 0; else log_warn "bun add -g failed"; return 1; fi
  else
    log_warn "npm/bun not available"; return 1
  fi

  log_info "Running: $npm_cmd install -g zenrouter"
  if $npm_cmd install -g zenrouter --silent >/dev/null 2>&1; then
    log_success "Installed zenrouter via npm"
    return 0
  fi
  log_warn "npm install without sudo failed (likely EACCES), retrying with sudo..."

  local sudo_cmd=""
  if command -v sudo >/dev/null 2>&1; then
    # Check if sudo is available and we can prompt
    if [ "$IS_INTERACTIVE" = true ] || [ -r /dev/tty ]; then
      if $sudo_cmd npm install -g zenrouter; then log_success "Installed via sudo npm"; return 0; fi
      # Try with explicit sudo
      if sudo "$npm_cmd" install -g zenrouter; then log_success "Installed via sudo"; return 0; fi
    else
      # Non-interactive: try passwordless sudo
      if sudo -n true 2>/dev/null && sudo "$npm_cmd" install -g zenrouter >/dev/null 2>&1; then log_success "Installed via sudo -n"; return 0; fi
      log_warn "No terminal for sudo prompt and passwordless sudo not available"
    fi
  else
    log_warn "sudo not available to fix EACCES"
  fi

  # Try configuring npm prefix to user dir as last resort before source fallback
  log_info "Trying user-local npm prefix fallback..."
  mkdir -p "$HOME/.npm-global"
  if "$npm_cmd" config set prefix "$HOME/.npm-global" >/dev/null 2>&1; then
    local link_dir; link_dir="$(get_link_dir)"; mkdir -p "$link_dir"
    # Ensure PATH includes npm-global/bin
    export PATH="$HOME/.npm-global/bin:$PATH"
    if "$npm_cmd" install -g zenrouter >/dev/null 2>&1; then
      # Ensure link exists in expected bin dir
      if [ -f "$HOME/.npm-global/bin/zenrouter" ] && [ ! -f "$link_dir/zenrouter" ]; then ln -sf "$HOME/.npm-global/bin/zenrouter" "$link_dir/zenrouter" || true; fi
      log_success "Installed via user-local prefix $HOME/.npm-global"
      log_warn "Add to PATH: export PATH=\"\$HOME/.npm-global/bin:\$PATH\" (add to ~/.bashrc / ~/.zshrc)"
      return 0
    fi
  fi

  return 1
}

# Source fallback: git clone + build
install_via_source() {
  log_step "Falling back to source install (git clone)"
  local link_dir; link_dir="$(get_link_dir)"
  mkdir -p "$INSTALL_DIR" "$link_dir"

  if ! command -v git >/dev/null 2>&1; then
    log_error "git is required for source install but not found"
    return 1
  fi

  # Ensure curl/tar are available for npm install inside repo
  if [ -d "$INSTALL_DIR/.git" ]; then
    log_info "Updating existing checkout at $INSTALL_DIR..."
    if ! git -C "$INSTALL_DIR" fetch --depth 1 origin "$BRANCH" >/dev/null 2>&1; then
      log_warn "fetch failed, trying pull"
      git -C "$INSTALL_DIR" pull --ff-only >/dev/null 2>&1 || true
    else
      git -C "$INSTALL_DIR" reset --hard "origin/$BRANCH" >/dev/null 2>&1 || true
    fi
  else
    log_info "Cloning $REPO_URL (branch: $BRANCH) to $INSTALL_DIR..."
    # Clean non-git dir if exists
    if [ -e "$INSTALL_DIR" ] && [ ! -d "$INSTALL_DIR/.git" ]; then rm -rf "$INSTALL_DIR"; mkdir -p "$INSTALL_DIR"; fi
    if ! git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR" 2>&1; then
      log_warn "Branch $BRANCH not found, trying default..."
      git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" || { log_error "git clone failed"; return 1; }
    fi
  fi

  cd "$INSTALL_DIR"

  # Choose package manager
  local pm="npm"
  if [ -x "$ZENROUTER_HOME/node/bin/npm" ]; then pm="$ZENROUTER_HOME/node/bin/npm"
  elif command -v npm >/dev/null 2>&1; then pm="npm"
  elif command -v bun >/dev/null 2>&1; then pm="bun"
  else log_error "No npm/bun found for build"; return 1; fi

  log_info "Installing dependencies ($pm install)..."
  if [ "$pm" = "bun" ]; then
    if ! bun install --production >/dev/null 2>&1 && ! bun install >/dev/null 2>&1; then log_warn "bun install failed, trying npm..."; pm="npm"; fi
  fi
  if [ "$pm" = "npm" ]; then
    # Use npm ci if lock exists, otherwise install
    if [ -f "package-lock.json" ]; then
      if ! "$pm" ci --silent >/dev/null 2>&1; then
        log_warn "npm ci failed, trying npm install..."
        "$pm" install --silent >/dev/null 2>&1 || { log_error "npm install failed"; return 1; }
      fi
    else
      "$pm" install --silent >/dev/null 2>&1 || { log_error "npm install failed"; return 1; }
    fi
  fi

  if [ "$SKIP_BUILD" = false ]; then
    log_info "Building ZenRouter (npm run build)..."
    if ! "$pm" run build --silent >/dev/null 2>&1; then
      log_warn "Build failed, but CLI may still work via dev mode"
      # Don't fail hard — dev mode can run without build
    else
      log_success "Build completed"
    fi
  else
    log_warn "Skipped build (--no-build)"
  fi

  # Link binary
  local cli_src="$INSTALL_DIR/cli/cli.js"
  local cli_link="$link_dir/zenrouter"
  if [ -f "$cli_src" ]; then
    ln -sf "$cli_src" "$cli_link"
    chmod +x "$cli_src" 2>/dev/null || true
    log_success "Linked $cli_link → $cli_src"
  else
    # Fallback: root cli.js?
    if [ -f "$INSTALL_DIR/cli.js" ]; then ln -sf "$INSTALL_DIR/cli.js" "$cli_link" && log_success "Linked $cli_link"; fi
  fi

  # Ensure link dir in PATH for current session
  export PATH="$link_dir:$PATH"
  return 0
}

ensure_path() {
  local link_dir; link_dir="$(get_link_dir)"
  case ":$PATH:" in *":$link_dir:"*) return 0;; esac
  log_warn "$link_dir is not in PATH"
  log_info "Add to your shell profile:"
  echo -e "  ${GRAY}export PATH=\"\$HOME/.local/bin:\$PATH\"${RESET}"
  # Also hint for fish, zsh
  if [ -f "$HOME/.zshrc" ]; then log_info "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.zshrc"; fi
  if [ -f "$HOME/.bashrc" ]; then log_info "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"; fi
  export PATH="$link_dir:$PATH"
}

verify_install() {
  log_step "Verifying installation"
  local link_dir; link_dir="$(get_link_dir)"
  # Refresh PATH
  export PATH="$link_dir:$PATH"
  export PATH="$ZENROUTER_HOME/node/bin:$PATH"
  export PATH="$HOME/.npm-global/bin:$PATH"
  export PATH="$HOME/.bun/bin:$PATH"

  if command -v zenrouter >/dev/null 2>&1; then
    local ver; ver=$(zenrouter --version 2>/dev/null || zenrouter -v 2>/dev/null || echo "unknown")
    log_success "ZenRouter found: $ver ($(command -v zenrouter))"
    return 0
  fi
  # Check link exists but not in PATH
  if [ -x "$link_dir/zenrouter" ]; then
    log_warn "zenrouter binary exists at $link_dir/zenrouter but not in PATH"
    ensure_path
    if command -v zenrouter >/dev/null 2>&1; then log_success "Now found after PATH fix"; return 0; fi
  fi
  if [ -x "$INSTALL_DIR/cli/cli.js" ]; then
    log_warn "CLI found at $INSTALL_DIR/cli/cli.js but not linked"
    ln -sf "$INSTALL_DIR/cli/cli.js" "$link_dir/zenrouter" 2>/dev/null || true
    if command -v zenrouter >/dev/null 2>&1; then log_success "Linked and found"; return 0; fi
  fi
  log_error "zenrouter command not found after install"
  log_info "Try: export PATH=\"\$HOME/.local/bin:\$PATH\" && zenrouter --help"
  log_info "Or check logs above for errors"
  return 1
}

# Main
main() {
  print_banner
  resolve_install_layout
  detect_os
  ensure_curl
  check_network
  check_git || true
  check_node || log_warn "Node check completed with warnings — will attempt install anyway"
  check_build_tools || true

  echo ""
  local installed=false

  # Try npm first (fastest, preferred)
  if install_via_npm; then
    installed=true
  else
    log_warn "npm global install failed — falling back to source"
    if install_via_source; then installed=true; else log_error "Source install also failed"; fi
  fi

  echo ""
  if [ "$installed" = true ] && verify_install; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ ZenRouter successfully installed!${RESET}"
    # Show version if possible
    local ver; ver=$(zenrouter --version 2>/dev/null || echo "")
    if [ -n "$ver" ]; then echo -e "  ${GRAY}Version: $ver${RESET}"; fi
  else
    echo ""
    echo -e "${YELLOW}${BOLD}⚠ ZenRouter installation completed with warnings${RESET}"
    echo -e "  ${GRAY}Check output above. Try manual steps:${RESET}"
    echo -e "  ${GRAY}  npm install -g zenrouter  # or${RESET}"
    echo -e "  ${GRAY}  git clone $REPO_URL $INSTALL_DIR && cd $INSTALL_DIR && npm install && npm run build${RESET}"
  fi

  # Next steps
  echo ""
  echo -e "${BLUE}─────────────────────────────────────────────────────────────${RESET}"
  echo -e "${BOLD}🚀 Get Started with ZenRouter:${RESET}"
  echo ""
  echo -e "  1. Start the gateway:"
  echo -e "     ${GREEN}${BOLD}zenrouter${RESET}  ${GRAY}# or: zenrouter --port 20128${RESET}"
  echo ""
  echo -e "  2. Dashboard:"
  echo -e "     ${CYAN}${BOLD}http://localhost:20128${RESET}  ${GRAY}(auto-opens)${RESET}"
  echo -e "     ${GRAY}API: http://localhost:20128/v1${RESET}"
  echo ""
  echo -e "  3. Use with AI tools:"
  echo -e "     ${GRAY}Claude Code:${RESET} ${BOLD}export ANTHROPIC_BASE_URL=http://localhost:20128${RESET}"
  echo -e "     ${GRAY}Codex/Cursor:${RESET} ${BOLD}export OPENAI_BASE_URL=http://localhost:20128/v1${RESET}"
  echo -e "     ${GRAY}API Key:${RESET} ${BOLD}sk-zenrouter${RESET} ${GRAY}(or dashboard key)${RESET}"
  echo ""
  echo -e "  4. Manage:"
  echo -e "     ${GRAY}zenrouter status  # health${RESET}"
  echo -e "     ${GRAY}zenrouter start   # background${RESET}"
  echo -e "     ${GRAY}zenrouter stop    # stop${RESET}"
  echo -e "     ${GRAY}zenrouter --help  # all options${RESET}"
  echo ""
  echo -e "  ${GRAY}Docs: https://github.com/ZenRouter/ZenRouter#readme${RESET}"
  echo -e "  ${GRAY}Issues: https://github.com/ZenRouter/ZenRouter/issues${RESET}"
  echo -e "${BLUE}─────────────────────────────────────────────────────────────${RESET}"
  echo ""
  ensure_path
}

main "$@"
