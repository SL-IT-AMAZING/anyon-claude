#!/bin/bash
# Kill all Tauri and Vite development servers

echo "🔍 Searching for running dev servers..."

# Find and kill Tauri processes
TAURI_PIDS=$(ps aux | grep -E "tauri dev|tauri.*dev" | grep -v grep | awk '{print $2}')
if [ ! -z "$TAURI_PIDS" ]; then
  echo "🛑 Killing Tauri processes: $TAURI_PIDS"
  echo "$TAURI_PIDS" | xargs kill -9 2>/dev/null
else
  echo "✅ No Tauri processes found"
fi

# Find and kill Vite processes
VITE_PIDS=$(ps aux | grep -E "vite|node.*vite" | grep -v grep | awk '{print $2}')
if [ ! -z "$VITE_PIDS" ]; then
  echo "🛑 Killing Vite processes: $VITE_PIDS"
  echo "$VITE_PIDS" | xargs kill -9 2>/dev/null
else
  echo "✅ No Vite processes found"
fi

# Kill processes using ports 1420 and 1421
PORT_PIDS=$(lsof -ti:1420,1421 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
  echo "🛑 Killing processes on ports 1420, 1421: $PORT_PIDS"
  echo "$PORT_PIDS" | xargs kill -9 2>/dev/null
else
  echo "✅ Ports 1420, 1421 are free"
fi

echo ""
echo "✨ All dev servers stopped!"
echo "You can now start fresh with: npm run tauri dev"
