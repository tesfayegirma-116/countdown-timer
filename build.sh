#!/bin/bash

# Zetseat Church Timer Build Script
# This script builds the application for different platforms

set -e

echo "🏗️  Building Zetseat Church Timer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Parse command line arguments
TARGET=""
DEBUG_MODE=false
CLEAN_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET="$2"
            shift 2
            ;;
        --debug)
            DEBUG_MODE=true
            shift
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --target TARGET    Build for specific target (e.g., x86_64-unknown-linux-gnu)"
            echo "  --debug           Build in debug mode"
            echo "  --clean           Clean build artifacts before building"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Build for current platform in release mode"
            echo "  $0 --debug                           # Build in debug mode"
            echo "  $0 --target x86_64-pc-windows-msvc   # Build for Windows"
            echo "  $0 --target x86_64-unknown-linux-gnu # Build for Linux"
            echo "  $0 --clean --target x86_64-apple-darwin # Clean build for macOS"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

# Check for Windows cross-compilation requirements on Linux
if [[ "$(uname)" == "Linux" ]]; then
    if [[ "$TARGET" == *"windows-msvc"* ]]; then
        print_error "Building for Windows MSVC target on Linux is not supported out-of-the-box."
        print_warning "The MSVC toolchain is proprietary and generally requires Windows."
        print_warning "For Linux -> Windows cross-compilation, use the GNU target instead:"
        print_status "  $0 --target x86_64-pc-windows-gnu"
        echo ""
        print_warning "If you must use MSVC, ensure you have set up 'cargo-xwin' or similar tools."
        read -p "Do you want to switch to x86_64-pc-windows-gnu? (Y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_warning "Continuing with MSVC build (expect failure if tools are missing)..."
        else
            TARGET="x86_64-pc-windows-gnu"
            print_status "Switched target to: $TARGET"
        fi
    fi

    if [[ "$TARGET" == *"windows-gnu"* ]]; then
        MISSING_DEPS=false
        
        # Check for Rust target
        if ! rustup target list --installed | grep -q "x86_64-pc-windows-gnu"; then
            print_status "Installing Rust target x86_64-pc-windows-gnu..."
            rustup target add x86_64-pc-windows-gnu
        fi
        
        # Check for MinGW
        if ! command -v x86_64-w64-mingw32-gcc &> /dev/null; then
            print_error "MinGW-w64 toolchain is missing!"
            echo "Please install it using:"
            echo "  sudo apt-get install mingw-w64"
            MISSING_DEPS=true
        fi

        # Check for NSIS
        if ! command -v makensis &> /dev/null; then
            print_warning "NSIS is missing! You won't be able to build the installer (.exe/.msi)."
            echo "Please install it using:"
            echo "  sudo apt-get install nsis"
        fi
        
        if [ "$MISSING_DEPS" = true ]; then
            exit 1
        fi
    fi
fi

# Clean build artifacts if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status "Cleaning build artifacts..."
    rm -rf out/
    rm -rf dist/
    rm -rf src-tauri/target/
    rm -rf node_modules/.cache/
    print_success "Build artifacts cleaned"
fi

# Install dependencies
print_status "Installing dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    print_error "Neither pnpm nor npm found. Please install one of them."
    exit 1
fi

# Build the frontend
print_status "Building frontend..."
if command -v pnpm &> /dev/null; then
    pnpm run build
else
    npm run build
fi

# Build the Tauri application
print_status "Building Tauri application..."

# Build Tauri args
TAURI_ARGS=""
if [ "$DEBUG_MODE" = true ]; then
    TAURI_ARGS="--debug"
fi
if [ -n "$TARGET" ]; then
    TAURI_ARGS="$TAURI_ARGS --target $TARGET"
    print_status "Building for target: $TARGET"
fi

if command -v pnpm &> /dev/null; then
    pnpm tauri build $TAURI_ARGS
else
    npx tauri build $TAURI_ARGS
fi

print_success "Build completed successfully!"

# Show build artifacts
print_status "Build artifacts:"
if [ -d "src-tauri/target" ]; then
    find src-tauri/target -name "*.deb" -o -name "*.rpm" -o -name "*.AppImage" -o -name "*.dmg" -o -name "*.msi" -o -name "*.exe" | head -10
fi

print_success "🎉 Zetseat Church Timer build complete!"
