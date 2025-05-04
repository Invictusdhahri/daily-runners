#!/bin/bash

# Daily Runners Deployment Script
# Usage: ./deploy.sh [production|test]

# Set environment
ENV=${1:-production}
echo "Deploying in $ENV mode"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file from example..."
  cp .env.example .env
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

# Setup systemd service
echo "Setting up systemd service..."
# Get absolute path of app directory
APP_DIR=$(pwd)
# Update the service file with correct paths
sed -i "s|/path/to/your/app|$APP_DIR|g" daily-runners.service

echo "To install as a service, run:"
echo "sudo cp daily-runners.service /etc/systemd/system/"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl enable daily-runners.service"
echo "sudo systemctl start daily-runners.service"
echo "sudo systemctl status daily-runners.service"

echo "Deployment preparation complete!" 