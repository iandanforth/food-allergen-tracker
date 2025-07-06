#!/bin/bash

# Food Allergen Tracker - macOS Cleanup Script
# This script removes the auto-startup service

PLIST_FILE="$HOME/Library/LaunchAgents/com.foodtracker.plist"

echo "Cleaning up Food Allergen Tracker auto-startup service..."

# Stop and remove the service
if [ -f "$PLIST_FILE" ]; then
    echo "Stopping service..."
    launchctl bootout gui/$(id -u) "$PLIST_FILE" 2>/dev/null || true
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    
    echo "Removing service file..."
    rm "$PLIST_FILE"
    
    echo "✅ Service removed successfully!"
else
    echo "No service found to remove."
fi

# Remove wrapper script if it exists
WRAPPER_SCRIPT="$(dirname "$0")/start-wrapper.sh"
if [ -f "$WRAPPER_SCRIPT" ]; then
    rm "$WRAPPER_SCRIPT"
    echo "Wrapper script removed."
fi

echo "Cleanup complete."