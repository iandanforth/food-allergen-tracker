#!/bin/bash

# Food Allergen Tracker - Linux Startup Script
# This script sets up the food allergen tracker to start automatically on Linux using systemd

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVICE_FILE="/etc/systemd/system/food-allergen-tracker.service"
USER=$(whoami)

echo "Setting up Food Allergen Tracker for automatic startup on Linux..."

# Check if running as root for systemd service creation
if [ "$EUID" -ne 0 ]; then
    echo "This script needs to be run with sudo to create a systemd service."
    echo "Please run: sudo ./startup-linux.sh"
    exit 1
fi

# Create the systemd service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Food Allergen Tracker
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/node_modules/.bin/pm2 start $SCRIPT_DIR/ecosystem.config.js
ExecReload=$SCRIPT_DIR/node_modules/.bin/pm2 reload all
ExecStop=$SCRIPT_DIR/node_modules/.bin/pm2 kill
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable the service
systemctl daemon-reload
systemctl enable food-allergen-tracker.service
systemctl start food-allergen-tracker.service

echo "✅ Food Allergen Tracker has been set up to start automatically!"
echo "The app will start on boot and restart if it crashes."
echo ""
echo "To manually control the service:"
echo "  Start:   sudo systemctl start food-allergen-tracker"
echo "  Stop:    sudo systemctl stop food-allergen-tracker"
echo "  Status:  sudo systemctl status food-allergen-tracker"
echo "  Disable: sudo systemctl disable food-allergen-tracker"
echo ""
echo "Logs are saved in: $SCRIPT_DIR/logs/"
echo "System logs: sudo journalctl -u food-allergen-tracker"