#!/bin/bash

# Daily Runners Deployment Script for VPS
# Usage: ./deploy.sh [production|test]

# Set environment
ENV=${1:-production}
echo "Deploying in $ENV mode"

# Check if running as root or sudo
if [ "$EUID" -ne 0 ] && [ ! -n "$SUDO_USER" ]; then
  echo "Please run with sudo or as root for system-level operations"
  echo "Example: sudo ./deploy.sh"
  exit 1
fi

# Install system dependencies
echo "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
  apt-get update
  apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
elif command -v yum &> /dev/null; then
  yum install -y gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel librsvg2-devel
else
  echo "Unsupported package manager. Please install dependencies manually."
  echo "Required packages: gcc/g++, cairo, pango, libjpeg, giflib, librsvg2"
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file from example..."
  cp env.example .env
  echo "Please edit .env file with your configuration values"
  exit 1
fi

# Set up logs directory
echo "Setting up logs directory..."
mkdir -p logs
chmod 755 logs

# Test run
if [ "$ENV" == "test" ]; then
  echo "Running in test mode..."
  node dist/index.js --test
  exit 0
fi

# Install as a service
echo "Setting up systemd service..."
APP_DIR=$(pwd)

# Update the service file with correct paths
sed -i "s|/opt/daily-runners|$APP_DIR|g" daily-runners.service
sed -i "s|User=nodejs|User=$(whoami)|g" daily-runners.service

# Copy service file to systemd
cp daily-runners.service /etc/systemd/system/

# Reload systemd and enable service
echo "Enabling and starting the service..."
systemctl daemon-reload
systemctl enable daily-runners.service
systemctl start daily-runners.service
systemctl status daily-runners.service

echo "Deployment complete!"
echo ""
echo "To view logs: sudo journalctl -u daily-runners.service -f"
echo "To restart service: sudo systemctl restart daily-runners.service"
echo "To check status: sudo systemctl status daily-runners.service" 