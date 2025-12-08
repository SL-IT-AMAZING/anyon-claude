#!/bin/bash
# Opcode Launcher Script
# Automatically sets up IME (Input Method Editor) environment for Korean/CJK input

# Set IME environment variables for ibus
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
export IBUS_ENABLE_SYNC_MODE=1
export IBUS_USE_PORTAL=0

# Ensure X11 backend for better IME compatibility
export GDK_BACKEND=x11

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Launch the actual Tauri binary
exec "$SCRIPT_DIR/opcode" "$@"
