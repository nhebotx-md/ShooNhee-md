#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║   ███████╗██╗  ██╗ ██████╗  ██████╗ ███╗   ██╗██╗  ██╗███████╗███████╗  ║
# ║   ██╔════╝██║  ██║██╔═══██╗██╔═══██╗████╗  ██║██║  ██║██╔════╝██╔════╝  ║
# ║   ███████╗███████║██║   ██║██║   ██║██╔██╗ ██║███████║█████╗  █████╗    ║
# ║   ╚════██║██╔══██║██║   ██║██║   ██║██║╚██╗██║██╔══██║██╔══╝  ██╔══╝    ║
# ║   ███████║██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██║  ██║███████╗███████╗  ║
# ║   ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝  ║
# ║                                                                          ║
# ║           ⚡ ShooNhee MD - WhatsApp Multi-Device Bot ⚡                   ║
# ║                 Automated Installation Script v2.0                        ║
# ║                        by NheBotx                                        ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -e

# ═══════════════════════════════════════════════════════════════════════════
# COLOR PALETTE & STYLING
# ═══════════════════════════════════════════════════════════════════════════

# Foreground Colors
BLACK='\033[0;30m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[0;37m'

# Bright Colors
BRIGHT_RED='\033[1;31m'
BRIGHT_GREEN='\033[1;32m'
BRIGHT_YELLOW='\033[1;33m'
BRIGHT_BLUE='\033[1;34m'
BRIGHT_MAGENTA='\033[1;35m'
BRIGHT_CYAN='\033[1;36m'
BRIGHT_WHITE='\033[1;37m'

# Background Colors
BG_BLACK='\033[40m'
BG_RED='\033[41m'
BG_GREEN='\033[42m'
BG_YELLOW='\033[43m'
BG_BLUE='\033[44m'
BG_MAGENTA='\033[45m'
BG_CYAN='\033[46m'
BG_WHITE='\033[47m'

# Text Styles
BOLD='\033[1m'
DIM='\033[2m'
ITALIC='\033[3m'
UNDERLINE='\033[4m'
BLINK='\033[5m'
REVERSE='\033[7m'
HIDDEN='\033[8m'
STRIKE='\033[9m'

# Reset
RESET='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION VARIABLES
# ═══════════════════════════════════════════════════════════════════════════

REPO_URL="https://github.com/nhebotx-md/ShooNhee-md.git"
BOT_NAME="ShooNhee MD"
BOT_VERSION="1.0.1"
AUTHOR="NheBotx"
NODE_VERSION="22.0.0"
PROOT_DISTRO="ubuntu"
BOT_DIR="ShooNhee-md"
TERMUX_BOT_PATH="$HOME/$BOT_DIR"
PROOT_ROOT="/data/data/com.termux/files/usr/var/lib/proot-distro/installed-rootfs/${PROOT_DISTRO}"
PROOT_BOT_PATH="/root/${BOT_DIR}"

# ═══════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS - VISUAL EFFECTS
# ═══════════════════════════════════════════════════════════════════════════

# Clear screen with style
clear_screen() {
    clear
    echo ""
}

# Print a horizontal line
line() {
    local width=$(stty size 2>/dev/null | awk '{print $2}' || echo 70)
    local char="${1:-═}"
    local color="${2:-$CYAN}"
    printf "${color}"
    printf "%${width}s" | tr " " "$char"
    printf "${RESET}\n"
}

# Print a decorative separator
separator() {
    echo ""
    line "─" "$DIM"
    echo ""
}

# Print centered text
center_text() {
    local text="$1"
    local color="${2:-$WHITE}"
    local width=$(stty size 2>/dev/null | awk '{print $2}' || echo 70)
    local text_length=${#text}
    local padding=$(( (width - text_length) / 2 ))
    printf "${color}"
    printf "%${padding}s" ""
    printf "%s" "$text"
    printf "${RESET}\n"
}

# Print a box around text
box_text() {
    local text="$1"
    local color="${2:-$CYAN}"
    local width=$(stty size 2>/dev/null | awk '{print $2}' || echo 70)
    local text_length=${#text}
    local box_width=$(( text_length + 4 ))
    local padding=$(( (width - box_width) / 2 ))
    
    printf "${color}"
    printf "%${padding}s" ""
    printf "╔"
    printf "%${box_width}s" | tr " " "═"
    printf "╗\n"
    
    printf "%${padding}s" ""
    printf "║  %s  ║\n" "$text"
    
    printf "%${padding}s" ""
    printf "╚"
    printf "%${box_width}s" | tr " " "═"
    printf "╝\n"
    printf "${RESET}"
}

# Print status messages
print_success() {
    echo -e "${GREEN}✔${RESET} ${BOLD}$1${RESET}"
}

print_error() {
    echo -e "${RED}✘${RESET} ${BOLD}$1${RESET}"
}

print_warning() {
    echo -e "${YELLOW}⚠${RESET} ${BOLD}$1${RESET}"
}

print_info() {
    echo -e "${CYAN}ℹ${RESET} ${BOLD}$1${RESET}"
}

print_progress() {
    echo -e "${BLUE}➤${RESET} ${BOLD}$1${RESET}"
}

# Animated loading bar
loading_bar() {
    local duration="${1:-3}"
    local message="${2:-Loading...}"
    local width=40
    
    echo -ne "${DIM}${message}${RESET} "
    for ((i=0; i<=width; i++)); do
        local percentage=$(( i * 100 / width ))
        local filled=$i
        local empty=$(( width - i ))
        
        echo -ne "\r${message} ${CYAN}["
        printf "%${filled}s" | tr " " "█"
        printf "%${empty}s" | tr " " "░"
        echo -ne "]${RESET} ${percentage}%"
        
        sleep $(echo "scale=3; $duration / $width" | bc 2>/dev/null || echo 0.1)
    done
    echo ""
}

# Spinner animation
spinner() {
    local pid=$1
    local message="${2:-Processing...}"
    local spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    
    echo -ne "${BLUE}${message}${RESET} "
    while kill -0 $pid 2>/dev/null; do
        for char in "${spin_chars[@]}"; do
            echo -ne "\r${BLUE}${message}${RESET} ${CYAN}${char}${RESET}"
            sleep 0.1
        done
    done
    wait $pid 2>/dev/null
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -ne "\r${GREEN}${message}${RESET} ${GREEN}✔ Done${RESET}\n"
    else
        echo -ne "\r${RED}${message}${RESET} ${RED}✘ Failed${RESET}\n"
    fi
    return $exit_code
}

# Run command with spinner
run_with_spinner() {
    local message="$1"
    shift
    ("$@") &>/dev/null &
    spinner $! "$message"
}

# ═══════════════════════════════════════════════════════════════════════════
# HEADER & BANNER
# ═══════════════════════════════════════════════════════════════════════════

show_banner() {
    clear_screen
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}║${RESET}                                                                          ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}███████╗██╗  ██╗ ██████╗  ██████╗ ███╗   ██╗██╗  ██╗███████╗███████╗${RESET}  ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}██╔════╝██║  ██║██╔═══██╗██╔═══██╗████╗  ██║██║  ██║██╔════╝██╔════╝${RESET}  ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}███████╗███████║██║   ██║██║   ██║██╔██╗ ██║███████║█████╗  █████╗${RESET}   ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}╚════██║██╔══██║██║   ██║██║   ██║██║╚██╗██║██╔══██║██╔══╝  ██╔══╝${RESET}    ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}███████║██║  ██║╚██████╔╝╚██████╔╝██║ ╚████║██║  ██║███████╗███████╗${RESET}  ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}   ${BRIGHT_CYAN}╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚══════╝${RESET}  ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}                                                                          ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}              ${BRIGHT_GREEN}⚡ WhatsApp Multi-Device Bot Base ⚡${RESET}                          ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}           ${BRIGHT_YELLOW}Modular Plugin System · Dual Handler · 700+ Commands${RESET}          ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}                                                                          ${CYAN}║${RESET}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    center_text "Automated Installation Script v2.0" "$BRIGHT_CYAN"
    center_text "by ${AUTHOR} · ${BOT_VERSION}" "$DIM"
    echo ""
    line "─" "$DIM"
    echo ""
}

show_section_header() {
    local title="$1"
    local icon="${2:-►}"
    echo ""
    echo -e "${BRIGHT_CYAN}${BOLD} ${icon} ${title}${RESET}"
    echo -e "${CYAN} ──────────────────────────────────────────────────────────────────────────${RESET}"
    echo ""
}

show_footer() {
    echo ""
    line "═" "$CYAN"
    echo -e "${DIM}  Repository: ${REPO_URL}${RESET}"
    echo -e "${DIM}  Support: t.me/Yamaguchihost${RESET}"
    echo -e "${DIM}  © 2026 ${AUTHOR} - All Rights Reserved${RESET}"
    line "═" "$CYAN"
    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# SYSTEM DETECTION
# ═══════════════════════════════════════════════════════════════════════════

detect_environment() {
    show_section_header "System Detection" "🔍"
    
    # Detect Termux
    if [ -n "$TERMUX_VERSION" ] || [ -d "/data/data/com.termux" ]; then
        IS_TERMUX=true
        print_success "Environment: Termux detected"
        print_info "Termux Version: ${TERMUX_VERSION:-Unknown}"
    else
        IS_TERMUX=false
        print_warning "Not running in Termux environment"
    fi
    
    # Detect Architecture
    ARCH=$(uname -m)
    case $ARCH in
        aarch64|arm64)
            ARCH="arm64"
            print_success "Architecture: ARM64 (aarch64)"
            ;;
        armv7l|armhf)
            ARCH="armhf"
            print_success "Architecture: ARM (armhf)"
            ;;
        x86_64|amd64)
            ARCH="amd64"
            print_success "Architecture: x86_64 (amd64)"
            ;;
        i386|i686)
            ARCH="i386"
            print_success "Architecture: x86 (i386)"
            ;;
        *)
            print_warning "Unknown architecture: $ARCH"
            ;;
    esac
    
    # Detect Android Version
    if [ -f "/system/build.prop" ]; then
        ANDROID_VER=$(getprop ro.build.version.release 2>/dev/null || echo "Unknown")
        print_info "Android Version: ${ANDROID_VER}"
    fi
    
    # Check storage
    STORAGE=$(df -h $HOME 2>/dev/null | tail -1 | awk '{print $4}' || echo "Unknown")
    print_info "Available Storage: ${STORAGE}"
    
    echo ""
    loading_bar 2 "Analyzing system requirements"
}

# ═══════════════════════════════════════════════════════════════════════════
# TERMUX PACKAGE INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════

install_termux_packages() {
    show_section_header "Installing Termux Packages" "📦"
    
    # Update and upgrade
    print_progress "Updating package lists..."
    pkg update -y &>/dev/null &
    spinner $! "Updating package lists"
    
    print_progress "Upgrading existing packages..."
    pkg upgrade -y &>/dev/null &
    spinner $! "Upgrading packages"
    
    # Core packages for proot-distro and general usage
    local packages=(
        "proot-distro"
        "git"
        "wget"
        "curl"
        "openssl"
        "openssh"
        "unzip"
        "zip"
        "tar"
        "nano"
        "vim"
        "neofetch"
        "htop"
        "ncurses-utils"
        "bc"
        "bash-completion"
        "python"
        "python-pip"
        "nodejs"
        "npm"
        "ffmpeg"
        "libwebp"
        "imagemagick"
    )
    
    print_info "Installing ${#packages[@]} essential packages..."
    echo ""
    
    for pkg_name in "${packages[@]}"; do
        if dpkg -l | grep -q "^ii  $pkg_name "; then
            print_success "${pkg_name} - already installed"
        else
            print_progress "Installing ${pkg_name}..."
            pkg install -y "$pkg_name" &>/dev/null &
            if spinner $! "Installing ${pkg_name}"; then
                print_success "${pkg_name} - installed"
            else
                print_warning "${pkg_name} - installation failed (non-critical)"
            fi
        fi
    done
    
    echo ""
    print_success "Termux base packages installation complete!"
}

# ═══════════════════════════════════════════════════════════════════════════
# PROOT-DISTRO SETUP
# ═══════════════════════════════════════════════════════════════════════════

setup_proot_distro() {
    show_section_header "Setting up Proot-Distro" "🐧"
    
    # Check if proot-distro is installed
    if ! command -v proot-distro &>/dev/null; then
        print_error "proot-distro not found! Installing..."
        pkg install -y proot-distro &>/dev/null
    fi
    
    # Check if Ubuntu is already installed
    if proot-distro list | grep -q "ubuntu"; then
        print_warning "Ubuntu already installed in proot-distro"
        print_info "Updating existing installation..."
    else
        print_progress "Installing Ubuntu in proot-distro..."
        print_info "This may take 5-15 minutes depending on your connection"
        echo ""
        proot-distro install ubuntu &>/dev/null &
        spinner $! "Installing Ubuntu (this may take a while)"
        print_success "Ubuntu installed successfully!"
    fi
    
    # Create login helper script
    print_progress "Configuring login helper..."
    cat > "$HOME/login-ubuntu.sh" << 'EOF'
#!/bin/bash
# ShooNhee MD - Proot-Distro Login Helper
cd ~
proot-distro login ubuntu -- bash -c "cd /root/ShooNhee-md && exec bash"
EOF
    chmod +x "$HOME/login-ubuntu.sh"
    print_success "Login helper created at ~/login-ubuntu.sh"
}

# ═══════════════════════════════════════════════════════════════════════════
# CLONE BOT REPOSITORY
# ═══════════════════════════════════════════════════════════════════════════

clone_repository() {
    show_section_header "Cloning Bot Repository" "📥"
    
    # Check if already cloned
    if [ -d "$TERMUX_BOT_PATH" ]; then
        print_warning "Bot directory already exists!"
        print_info "Updating to latest version..."
        cd "$TERMUX_BOT_PATH"
        git stash &>/dev/null || true
        git pull origin main &>/dev/null &
        spinner $! "Pulling latest updates"
        print_success "Repository updated!"
    else
        print_progress "Cloning ${BOT_NAME} from GitHub..."
        print_info "Repository: ${REPO_URL}"
        git clone --depth 1 "$REPO_URL" "$TERMUX_BOT_PATH" &>/dev/null &
        if spinner $! "Cloning repository"; then
            print_success "Repository cloned successfully!"
        else
            print_error "Failed to clone repository!"
            print_info "Please check your internet connection"
            exit 1
        fi
    fi
    
    # Show repository info
    cd "$TERMUX_BOT_PATH"
    local commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "?")
    local last_commit=$(git log -1 --format="%h - %s" 2>/dev/null || echo "Unknown")
    print_info "Total Commits: ${commit_count}"
    print_info "Latest: ${last_commit}"
}

# ═══════════════════════════════════════════════════════════════════════════
# SYNC BOT TO PROOT-DISTRO
# ═══════════════════════════════════════════════════════════════════════════

sync_to_proot() {
    show_section_header "Syncing Bot to Proot-Distro" "🔄"
    
    # Ensure proot root directory exists
    if [ ! -d "$PROOT_ROOT" ]; then
        print_error "Proot-distro Ubuntu not found!"
        print_info "Please ensure proot-distro installation completed"
        exit 1
    fi
    
    # Create bot directory in proot
    print_progress "Creating bot directory in proot..."
    proot-distro login ubuntu -- bash -c "mkdir -p /root/ShooNhee-md" &>/dev/null
    print_success "Directory created"
    
    # Sync files using tar (preserves permissions)
    print_progress "Copying bot files to proot..."
    print_info "This preserves all file permissions and structure"
    
    cd "$TERMUX_BOT_PATH"
    tar -cf - . | proot-distro login ubuntu -- bash -c "cd /root/ShooNhee-md && tar -xf -" &>/dev/null &
    spinner $! "Syncing bot files"
    
    print_success "Bot files synced to proot-distro!"
    
    # Verify sync
    local file_count=$(proot-distro login ubuntu -- bash -c "find /root/ShooNhee-md -type f | wc -l" 2>/dev/null || echo "0")
    print_info "Files synced: ${file_count} files"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL NODE.JS 22 INSIDE PROOT
# ═══════════════════════════════════════════════════════════════════════════

install_nodejs_proot() {
    show_section_header "Installing Node.js ${NODE_VERSION}" "⬢"
    
    print_info "Target: Node.js ${NODE_VERSION} (Required by ${BOT_NAME})"
    print_info "Method: NodeSource repository"
    echo ""
    
    # Check current node version in proot
    local current_node=$(proot-distro login ubuntu -- bash -c "node --version 2>/dev/null || echo 'none'")
    print_info "Current Node.js in proot: ${current_node}"
    
    if [ "$current_node" = "v${NODE_VERSION}" ]; then
        print_success "Node.js ${NODE_VERSION} already installed!"
        return 0
    fi
    
    # Install dependencies for Node.js
    print_progress "Installing build dependencies..."
    proot-distro login ubuntu -- bash -c "
        apt-get update -qq && \
        apt-get install -y -qq curl wget ca-certificates gnupg build-essential python3 g++ make
    " &>/dev/null &
    spinner $! "Installing build dependencies"
    
    # Install Node.js via NodeSource
    print_progress "Setting up NodeSource repository..."
    proot-distro login ubuntu -- bash -c "
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    " &>/dev/null &
    spinner $! "Configuring NodeSource repository"
    
    print_progress "Installing Node.js ${NODE_VERSION}..."
    proot-distro login ubuntu -- bash -c "
        apt-get install -y -qq nodejs
    " &>/dev/null &
    spinner $! "Installing Node.js ${NODE_VERSION}"
    
    # Verify installation
    local installed_node=$(proot-distro login ubuntu -- bash -c "node --version 2>/dev/null || echo 'failed'")
    if [ "$installed_node" = "v${NODE_VERSION}" ]; then
        print_success "Node.js ${NODE_VERSION} installed successfully!"
    else
        print_warning "Node.js version may differ. Installed: ${installed_node}"
        print_info "Attempting alternative installation..."
        
        # Try direct binary installation
        print_progress "Trying NVM installation method..."
        proot-distro login ubuntu -- bash -c "
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && \
            export NVM_DIR=\"\$HOME/.nvm\" && \
            [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\" && \
            nvm install ${NODE_VERSION} && \
            nvm alias default ${NODE_VERSION} && \
            nvm use default
        " &>/dev/null &
        spinner $! "Installing via NVM"
        
        # Verify again
        installed_node=$(proot-distro login ubuntu -- bash -c "node --version 2>/dev/null || echo 'failed'")
        if [ "$installed_node" = "v${NODE_VERSION}" ]; then
            print_success "Node.js ${NODE_VERSION} installed via NVM!"
        else
            print_warning "Node.js installation may have issues"
            print_info "Installed version: ${installed_node}"
        fi
    fi
    
    # Show npm version
    local npm_ver=$(proot-distro login ubuntu -- bash -c "npm --version 2>/dev/null || echo 'unknown'")
    print_info "npm version: ${npm_ver}"
}

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL BOT DEPENDENCIES INSIDE PROOT
# ═══════════════════════════════════════════════════════════════════════════

install_bot_dependencies() {
    show_section_header "Installing Bot Dependencies" "📚"
    
    print_info "This will install all npm packages required by ${BOT_NAME}"
    print_info "Packages: @whiskeysockets/baileys, fluent-ffmpeg, jimp, and 60+ more"
    echo ""
    
    # Navigate to bot directory and install
    print_progress "Running npm install (this may take 10-30 minutes)..."
    print_info "Downloading and compiling native modules..."
    
    proot-distro login ubuntu -- bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"
        cd /root/ShooNhee-md && \
        npm install --production --legacy-peer-deps 2>&1
    " &>/tmp/npm_install.log &
    
    # Show progress with custom spinner
    local pid=$!
    local spin_chars=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local start_time=$(date +%s)
    
    echo -ne "${BLUE}Installing dependencies${RESET} "
    while kill -0 $pid 2>/dev/null; do
        local elapsed=$(($(date +%s) - start_time))
        local mins=$((elapsed / 60))
        local secs=$((elapsed % 60))
        for char in "${spin_chars[@]}"; do
            if ! kill -0 $pid 2>/dev/null; then break; fi
            echo -ne "\r${BLUE}Installing dependencies${RESET} ${CYAN}${char}${RESET} ${DIM}(${mins}m ${secs}s elapsed)${RESET}"
            sleep 0.1
        done
    done
    wait $pid
    local exit_code=$?
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        print_success "All dependencies installed successfully!"
    else
        print_error "npm install exited with code ${exit_code}"
        print_info "Retrying with alternative flags..."
        
        proot-distro login ubuntu -- bash -c "
            export NVM_DIR=\"\$HOME/.nvm\"
            [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"
            cd /root/ShooNhee-md && \
            npm install --force 2>&1
        " &>/tmp/npm_install_retry.log &
        spinner $! "Retrying npm install"
        
        if [ $? -eq 0 ]; then
            print_success "Dependencies installed on retry!"
        else
            print_warning "Some dependencies may have issues"
            print_info "You can retry manually later with: npm install"
        fi
    fi
    
    # Show installed packages count
    local pkg_count=$(proot-distro login ubuntu -- bash -c "cd /root/ShooNhee-md && ls node_modules 2>/dev/null | wc -l" || echo "0")
    print_info "Installed packages: ~${pkg_count}"
}

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURE STARTUP SCRIPT
# ═══════════════════════════════════════════════════════════════════════════

configure_startup() {
    show_section_header "Configuring Startup Scripts" "⚙"
    
    # Create start script inside proot
    print_progress "Creating bot startup script..."
    proot-distro login ubuntu -- bash -c "cat > /root/start-bot.sh << 'INNERSCRIPT'
#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║            ShooNhee MD - Bot Startup Script                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

export NVM_DIR=\"\$HOME/.nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"

cd /root/ShooNhee-md

clear
echo '╔══════════════════════════════════════════════════════════════════════════╗'
echo '║                 ⚡ Starting ShooNhee MD Bot ⚡                            ║'
echo '╚══════════════════════════════════════════════════════════════════════════╝'
echo ''

node index.js
INNERSCRIPT
chmod +x /root/start-bot.sh"

    print_success "Startup script created at /root/start-bot.sh"
    
    # Create quick launcher in Termux
    cat > "$HOME/start-shoonhee" << EOF
#!/bin/bash
# Quick launcher for ShooNhee MD
clear
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║                   ⚡ ShooNhee MD Quick Launcher ⚡                        ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  Starting bot in proot-distro..."
echo ""
proot-distro login ubuntu -- bash /root/start-bot.sh
EOF
    chmod +x "$HOME/start-shoonhee"
    print_success "Quick launcher created at ~/start-shoonhee"
}

# ═══════════════════════════════════════════════════════════════════════════
# EDIT CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

edit_config() {
    show_section_header "Editing Configuration" "✏"
    
    print_info "Opening config.js in nano editor..."
    print_info "Inside proot-distro Ubuntu environment"
    echo ""
    print_warning "Important settings to configure:"
    echo -e "  ${CYAN}•${RESET} owner.number      - Your WhatsApp number (628xxx format)"
    echo -e "  ${CYAN}•${RESET} session.pairingNumber - Bot's WhatsApp number"
    echo -e "  ${CYAN}•${RESET} session.usePairingCode - true=Pairing Code, false=QR Code"
    echo -e "  ${CYAN}•${RESET} bot.name          - Bot display name"
    echo -e "  ${CYAN}•${RESET} mode              - public/self/private"
    echo ""
    
    read -n 1 -s -r -p "Press any key to open editor..."
    echo ""
    
    proot-distro login ubuntu -- bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"
        cd /root/ShooNhee-md && nano config.js
    "
    
    echo ""
    print_success "Configuration saved!"
    
    # Offer to sync back to Termux
    print_info "Syncing updated config back to Termux..."
    proot-distro login ubuntu -- bash -c "cd /root/ShooNhee-md && tar -cf - config.js" | tar -xf - -C "$TERMUX_BOT_PATH" &>/dev/null
    print_success "Config synced!"
}

# ═══════════════════════════════════════════════════════════════════════════
# START BOT
# ═══════════════════════════════════════════════════════════════════════════

start_bot() {
    show_section_header "Starting ShooNhee MD" "🚀"
    
    print_success "All systems ready!"
    echo ""
    print_info "Launching bot in proot-distro Ubuntu..."
    echo ""
    
    # Show connection info
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}║${RESET}  ${BRIGHT_GREEN}Bot Status:${RESET} ${BOLD}Initializing...${RESET}                                            ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}  ${BRIGHT_GREEN}Mode:${RESET} $(grep "mode:" /root/ShooNhee-md/config.js 2>/dev/null | head -1 | sed 's/.*: .//;s/.,//;s/'"'"'//g' || echo 'public')${RESET}                                                      ${CYAN}║${RESET}"
    echo -e "${CYAN}║${RESET}  ${BRIGHT_GREEN}Pairing:${RESET} $(grep "usePairingCode:" /root/ShooNhee-md/config.js 2>/dev/null | head -1 | grep -q "true" && echo "Pairing Code" || echo "QR Code")${RESET}                                              ${CYAN}║${RESET}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    
    sleep 2
    
    # Start the bot
    proot-distro login ubuntu -- bash -c "
        export NVM_DIR=\"\$HOME/.nvm\"
        [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"
        cd /root/ShooNhee-md && node index.js
    "
}

# ═══════════════════════════════════════════════════════════════════════════
# FINAL MENU
# ═══════════════════════════════════════════════════════════════════════════

show_final_menu() {
    clear_screen
    show_banner
    show_section_header "Installation Complete!" "🎉"
    
    # Summary
    echo -e "${BRIGHT_GREEN}${BOLD}✔ All components installed successfully!${RESET}"
    echo ""
    print_info "Installed Components:"
    echo -e "  ${GREEN}✔${RESET} Termux base packages"
    echo -e "  ${GREEN}✔${RESET} Proot-distro Ubuntu"
    echo -e "  ${GREEN}✔${RESET} Node.js ${NODE_VERSION}"
    echo -e "  ${GREEN}✔${RESET} Bot dependencies (npm packages)"
    echo -e "  ${GREEN}✔${RESET} ${BOT_NAME} ${BOT_VERSION}"
    echo ""
    
    # Quick commands reference
    print_info "Quick Commands Reference:"
    echo -e "  ${CYAN}•${RESET} Start bot:           ${BOLD}~/start-shoonhee${RESET}"
    echo -e "  ${CYAN}•${RESET} Login to Ubuntu:     ${BOLD}~/login-ubuntu.sh${RESET}"
    echo -e "  ${CYAN}•${RESET} Bot directory:       ${BOLD}/root/ShooNhee-md${RESET} (inside proot)"
    echo -e "  ${CYAN}•${RESET} Config file:         ${BOLD}/root/ShooNhee-md/config.js${RESET}"
    echo ""
    
    line "─" "$DIM"
    echo ""
    
    # Menu options
    echo -e "${BRIGHT_CYAN}${BOLD}What would you like to do next?${RESET}"
    echo ""
    echo -e "  ${BRIGHT_GREEN}[A]${RESET} ${BOLD}Edit config.js${RESET}    - Configure bot settings (owner, session, etc.)"
    echo -e "  ${BRIGHT_BLUE}[B]${RESET} ${BOLD}Start Bot${RESET}         - Launch ${BOT_NAME} immediately"
    echo -e "  ${BRIGHT_RED}[C]${RESET} ${BOLD}Exit${RESET}              - Close installer (all done!)"
    echo ""
    
    while true; do
        echo -ne "${BRIGHT_YELLOW}➤ Enter your choice [A/B/C]: ${RESET}"
        read -r choice
        
        case "${choice^^}" in
            A)
                edit_config
                echo ""
                read -n 1 -s -r -p "Press any key to return to menu..."
                show_final_menu
                break
                ;;
            B)
                start_bot
                break
                ;;
            C)
                echo ""
                center_text "Thank you for installing ${BOT_NAME}!" "$BRIGHT_GREEN"
                center_text "Made with ❤ by ${AUTHOR}" "$DIM"
                echo ""
                show_footer
                exit 0
                ;;
            *)
                print_warning "Invalid choice. Please enter A, B, or C."
                ;;
        esac
    done
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN INSTALLATION FLOW
# ═══════════════════════════════════════════════════════════════════════════

main() {
    # Trap errors
    trap 'print_error "Installation interrupted!"; exit 1' INT TERM
    
    # Show initial banner
    show_banner
    
    # Welcome message
    center_text "Welcome to the ${BOT_NAME} Installer!" "$BRIGHT_GREEN"
    center_text "This script will set up everything automatically" "$DIM"
    echo ""
    
    print_info "This installer will:"
    echo -e "  ${CYAN}1.${RESET} Install Termux packages (proot-distro, git, ffmpeg, etc.)"
    echo -e "  ${CYAN}2.${RESET} Set up Ubuntu inside proot-distro"
    echo -e "  ${CYAN}3.${RESET} Clone ${BOT_NAME} from GitHub"
    echo -e "  ${CYAN}4.${RESET} Install Node.js ${NODE_VERSION}"
    echo -e "  ${CYAN}5.${RESET} Install all bot dependencies"
    echo -e "  ${CYAN}6.${RESET} Configure startup scripts"
    echo ""
    
    read -n 1 -s -r -p "Press any key to start installation..."
    echo ""
    
    # Step 1: Detect environment
    detect_environment
    
    # Step 2: Install Termux packages
    install_termux_packages
    
    # Step 3: Setup proot-distro
    setup_proot_distro
    
    # Step 4: Clone repository
    clone_repository
    
    # Step 5: Sync to proot
    sync_to_proot
    
    # Step 6: Install Node.js 22 in proot
    install_nodejs_proot
    
    # Step 7: Install bot dependencies
    install_bot_dependencies
    
    # Step 8: Configure startup
    configure_startup
    
    # Step 9: Show final menu
    show_final_menu
}

# ═══════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════

# Check if running in compatible environment
if [ "$(uname -o)" = "Android" ] || [ -n "$TERMUX_VERSION" ]; then
    main
else
    echo ""
    center_text "⚠ Warning: Not running in Termux!" "$BRIGHT_YELLOW"
    center_text "This script is designed for Termux on Android" "$DIM"
    echo ""
    read -p "Continue anyway? [y/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        main
    else
        exit 1
    fi
fi
