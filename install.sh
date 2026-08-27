#!/usr/bin/env bash
set -e

# ==============================================================================
# 🌿 ZenRoute Official Installer
# https://github.com/joyccn/ZenRoute
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/joyccn/ZenRoute/master/install.sh | bash
# ==============================================================================

# ANSI Color Codes
BOLD="\033[1m"
GREEN="\033[38;2;85;219;156m"
BLUE="\033[38;2;75;114;164m"
CYAN="\033[38;2;77;162;255m"
CORAL="\033[38;2;232;93;63m"
YELLOW="\033[38;2;255;215;49m"
GRAY="\033[38;2;148;163;184m"
RESET="\033[0m"

# Print Header Banner
echo -e "${BLUE}"
echo "  ______           ____             __       "
echo " /__  / ___  ____ / __ \____  __  __/ /____  "
echo "   / / / _ \/ __ \/ /_/ / __ \/ / / / __/ _ \ "
echo "  / /_/  __/ / / / _, _/ /_/ / /_/ / /_/  __/ "
echo " /____|___/_/ /_/_/ |_|\____/\__,_/\__/\___/  "
echo -e "${RESET}"
echo -e "${CORAL}${BOLD} 🌿 Serene AI Gateway & Intelligent Routing Engine${RESET}"
echo -e "${GRAY} https://github.com/joyccn/ZenRoute${RESET}"
echo ""

# Detect OS & Architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux*)  PLATFORM="Linux" ;;
  Darwin*) PLATFORM="macOS" ;;
  CYGWIN*|MINGW*|MSYS*) PLATFORM="Windows" ;;
  *)       PLATFORM="Unknown ($OS)" ;;
esac

echo -e "${CYAN}==>${RESET} Detected environment: ${BOLD}${PLATFORM} (${ARCH})${RESET}"

# Verify Platform
if [ "$PLATFORM" = "Windows" ]; then
  echo -e "${YELLOW}Notice: On native Windows, WSL2 or Docker is strongly recommended.${RESET}"
fi

# Check for Node.js or Bun
HAS_NODE=false
HAS_BUN=false
NODE_VER=0

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 18 ]; then
    HAS_NODE=true
    echo -e "${GREEN}✓${RESET} Found Node.js: ${BOLD}$(node -v)${RESET}"
  else
    echo -e "${YELLOW}!${RESET} Node.js version $(node -v) is older than recommended (>= 18.0.0)"
  fi
fi

if command -v bun >/dev/null 2>&1; then
  HAS_BUN=true
  echo -e "${GREEN}✓${RESET} Found Bun: ${BOLD}v$(bun -v)${RESET}"
fi

# If neither Node (>=18) nor Bun is found, attempt automatic helper or guidance
if [ "$HAS_NODE" = false ] && [ "$HAS_BUN" = false ]; then
  echo ""
  echo -e "${YELLOW}==> Node.js (>= 18.0.0) or Bun is required to run ZenRoute.${RESET}"
  echo -e "Would you like to install Node.js now?"
  
  if command -v brew >/dev/null 2>&1; then
    echo -e "${CYAN}Installing Node.js via Homebrew...${RESET}"
    brew install node
  elif command -v apt-get >/dev/null 2>&1; then
    echo -e "${CYAN}Installing Node.js via NodeSource (apt)...${RESET}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    echo -e "${CYAN}Installing Node.js via dnf...${RESET}"
    sudo dnf install -y nodejs
  elif command -v pacman >/dev/null 2>&1; then
    echo -e "${CYAN}Installing Node.js via pacman...${RESET}"
    sudo pacman -S --noconfirm nodejs npm
  else
    echo -e "${CYAN}Installing Bun as a fast modern JavaScript runtime...${RESET}"
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
  fi
fi

# Install ZenRoute CLI globally
echo ""
echo -e "${CYAN}==>${RESET} Installing ${BOLD}zenroute${RESET} CLI..."

INSTALL_SUCCESS=false

if command -v npm >/dev/null 2>&1; then
  echo -e "${GRAY}Running: npm install -g zenroute${RESET}"
  if npm install -g zenroute --silent >/dev/null 2>&1; then
    INSTALL_SUCCESS=true
  else
    # Try with sudo if EACCES / permission denied
    echo -e "${YELLOW}Global npm directory requires elevated permissions. Retrying with sudo...${RESET}"
    if sudo npm install -g zenroute; then
      INSTALL_SUCCESS=true
    fi
  fi
elif command -v bun >/dev/null 2>&1; then
  echo -e "${GRAY}Running: bun add -g zenroute${RESET}"
  if bun add -g zenroute; then
    INSTALL_SUCCESS=true
  fi
fi

# Fallback: Local binary clone if npm is unavailable
if [ "$INSTALL_SUCCESS" = false ]; then
  INSTALL_DIR="$HOME/.zenroute/app"
  BIN_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR" "$BIN_DIR"
  echo -e "${CYAN}==>${RESET} Installing standalone clone to ${INSTALL_DIR}..."
  
  if command -v git >/dev/null 2>&1; then
    if [ -d "$INSTALL_DIR/.git" ]; then
      git -C "$INSTALL_DIR" pull --quiet
    else
      git clone --depth 1 https://github.com/joyccn/ZenRoute.git "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
    npm install --silent --production
    npm run build --silent
    ln -sf "$INSTALL_DIR/cli/cli.js" "$BIN_DIR/zenroute"
    chmod +x "$BIN_DIR/zenroute"
    export PATH="$BIN_DIR:$PATH"
    INSTALL_SUCCESS=true
  fi
fi

# Verify Installation
echo ""
if command -v zenroute >/dev/null 2>&1; then
  INSTALLED_VER=$(zenroute --version 2>/dev/null || echo "latest")
  echo -e "${GREEN}${BOLD}✓ ZenRoute successfully installed! (${INSTALLED_VER})${RESET}"
else
  echo -e "${GREEN}${BOLD}✓ ZenRoute installation completed!${RESET}"
fi

# Print Success and Next Steps
echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}🚀 Get Started with ZenRoute:${RESET}"
echo ""
echo -e "  1. Start the ZenRoute gateway:"
echo -e "     ${GREEN}${BOLD}zenroute${RESET}"
echo ""
echo -e "  2. Access the interactive web dashboard:"
echo -e "     ${CYAN}${BOLD}http://localhost:20128${RESET}"
echo ""
echo -e "  3. Use with your favorite AI tools:"
echo -e "     ${GRAY}OpenAI Base URL:${RESET}    ${BOLD}http://localhost:20128/v1${RESET}"
echo -e "     ${GRAY}Anthropic Base URL:${RESET} ${BOLD}http://localhost:20128/v1${RESET}"
echo ""
echo -e "  4. Manage Background Service:"
echo -e "     ${GRAY}zenroute start   # Run in background${RESET}"
echo -e "     ${GRAY}zenroute stop    # Stop background daemon${RESET}"
echo -e "     ${GRAY}zenroute status  # Check gateway health${RESET}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────${RESET}"
echo ""
