#!/bin/bash

# Food Allergen Tracker - macOS Startup Script
# This script sets up the food allergen tracker to start automatically on macOS

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PLIST_FILE="$HOME/Library/LaunchAgents/com.foodtracker.plist"

echo "Setting up Food Allergen Tracker for automatic startup on macOS..."

# Detect Node.js path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ Node.js not found in PATH. Please ensure Node.js is installed."
    exit 1
fi

echo "Detected Node.js at: $NODE_PATH"

# Remove existing plist if it exists
if [ -f "$PLIST_FILE" ]; then
    echo "Removing existing service..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    rm "$PLIST_FILE"
fi

# Create a simple shell script wrapper
WRAPPER_SCRIPT="$SCRIPT_DIR/start-wrapper.sh"
cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash
cd "$SCRIPT_DIR"
export PATH="$PATH"
source ~/.bashrc 2>/dev/null || true
source ~/.zshrc 2>/dev/null || true
npm run pm2:start
EOF
chmod +x "$WRAPPER_SCRIPT"

# Create the LaunchAgent plist file
cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.foodtracker</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>$WRAPPER_SCRIPT</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$SCRIPT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/logs/startup.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/logs/startup_error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$PATH</string>
    </dict>
</dict>
</plist>
EOF

# Load the LaunchAgent using bootstrap (modern approach)
launchctl bootstrap gui/$(id -u) "$PLIST_FILE"

echo "✅ Food Allergen Tracker has been set up to start automatically!"
echo "The app will start on boot and restart if it crashes."
echo ""
echo "To manually control the service:"
echo "  Start:   launchctl kickstart -k gui/\$(id -u)/com.foodtracker"
echo "  Stop:    launchctl bootout gui/\$(id -u) $PLIST_FILE"
echo "  Status:  npm run pm2:status"
echo ""
echo "Logs are saved in: $SCRIPT_DIR/logs/"
echo "Startup logs: $SCRIPT_DIR/logs/startup.log"