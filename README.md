# Food Allergen Tracker

A web application to track food allergen exposure for infants, helping ensure regular exposure to prevent food allergies.

## Features

- Add meals with selected allergens
- Track time since last exposure for each allergen
- Color-coded status (green: ≤3 days, yellow: 4-6 days, red: ≥7 days, light blue: never given)
- Separate tracking for egg whites and egg yolks
- Edit meal dates and times
- Delete meals with confirmation
- Meal history with details
- Mobile-responsive design
- Multi-user support with shared database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to `http://localhost:3000`

## Network Access

To access the app from other devices on your local network:

1. Start the server with `npm start`
2. Find your computer's IP address:
   - **macOS/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows**: `ipconfig | findstr "IPv4"`
3. On other devices, go to `http://[YOUR_IP_ADDRESS]:3000`

Example: If your IP is `192.168.1.100`, use `http://192.168.1.100:3000`

**Note**: Make sure all devices are on the same WiFi network and your firewall allows connections on port 3000.

## Auto-Start on Boot & Crash Recovery

To set up the app to start automatically when your computer boots and restart if it crashes:

### Option 1: Quick Setup (Recommended)

1. Install dependencies: `npm install`
2. Run the setup script for your operating system:
   - **macOS**: `./startup-macos.sh`
   - **Linux**: `sudo ./startup-linux.sh`
   - **Windows**: Right-click `startup-windows.bat` → "Run as administrator"

### Option 2: Manual PM2 Setup

1. Install dependencies: `npm install`
2. Start with PM2: `npm run pm2:start`
3. Save PM2 configuration: `pm2 save`
4. Setup startup hook: `pm2 startup` (follow the instructions it provides)

### PM2 Management Commands

```bash
npm run pm2:start    # Start the app with PM2
npm run pm2:stop     # Stop the app
npm run pm2:restart  # Restart the app
npm run pm2:status   # Check status
npm run pm2:logs     # View logs
```

### Features:
- **Auto-restart**: App restarts automatically if it crashes (up to 10 times)
- **Boot startup**: Starts when your computer boots up
- **Logging**: All logs saved to `./logs/` directory
- **Memory management**: Restarts if memory usage exceeds 1GB
- **Delay on restart**: 5-second delay between restart attempts

### Removing Auto-Start:
- **macOS**: `launchctl unload ~/Library/LaunchAgents/com.foodtracker.plist`
- **Linux**: `sudo systemctl disable food-allergen-tracker`
- **Windows**: `pm2-service-uninstall`

## Development

To run with auto-restart during development:
```bash
npm run dev
```

## Database

The application uses SQLite database (`allergen_tracker.db`) which will be created automatically when you first run the server.

## Usage

1. Click "Add Meal" to record a new meal
2. Select which allergens were included
3. Click "Save Meal" to store the data
4. View allergen status on the main page
5. Click any meal in the history to see details

The app will warn you if any allergen hasn't been given in over 1 week (7 days).