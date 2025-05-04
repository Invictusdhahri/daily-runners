#!/bin/bash
set -e

# Make sure ts-node is installed
echo "Ensuring ts-node is installed..."
npm install -g ts-node typescript

# Make sure the local ts-node is executable
chmod +x ./node_modules/.bin/ts-node

# Run the application
echo "Starting application..."
node ./node_modules/.bin/ts-node index.ts 