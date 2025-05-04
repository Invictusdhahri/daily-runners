#!/bin/bash

# fly-deploy.sh - Helper script for Fly.io deployment
# Usage: ./fly-deploy.sh [--init | --deploy | --logs | --console]

set -e

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "Error: flyctl is not installed."
    echo "Please install it first:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Process arguments
case "$1" in
    --init)
        echo "Initializing Fly.io app..."
        flyctl launch --no-deploy
        
        echo "Creating volume for persistent data..."
        flyctl volumes create daily_runners_data --size 1 --region auto
        
        echo "Remember to set your secrets:"
        echo "  flyctl secrets set INTERCOM_TOKEN=your_token INTERCOM_ADMIN_ID=your_admin_id IMGBB_API_KEY=your_key DATA_DIR=/app/data"
        ;;
        
    --deploy)
        echo "Deploying to Fly.io..."
        flyctl deploy
        ;;
        
    --logs)
        echo "Viewing logs..."
        flyctl logs
        ;;
        
    --console)
        echo "Opening console..."
        flyctl ssh console
        ;;
        
    *)
        echo "Daily Runners - Fly.io Deployment Helper"
        echo "Usage: ./fly-deploy.sh [option]"
        echo ""
        echo "Options:"
        echo "  --init     Initialize Fly.io app and create volume"
        echo "  --deploy   Deploy the application"
        echo "  --logs     View application logs"
        echo "  --console  Open a console to the VM"
        ;;
esac 