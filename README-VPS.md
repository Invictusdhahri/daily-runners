# Daily Runners VPS Deployment Guide

This guide provides instructions for deploying the Daily Runners application on a Virtual Private Server (VPS).

## Prerequisites

- Node.js 18 or higher
- npm
- A Linux VPS (Ubuntu/Debian recommended)
- Basic knowledge of Linux and systemd

## Required Dependencies

The application requires some native dependencies for image processing. Install them with:

```bash
# For Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/daily-runners.git
cd daily-runners
```

### 2. Set Up Environment Variables

Create a `.env` file based on the `.env.example`:

```bash
cp .env.example .env
nano .env
```

Fill in all the required environment variables:
- `INTERCOM_TOKEN`: Your Intercom API token
- `INTERCOM_ADMIN_ID`: Your Intercom admin ID
- `IMGBB_API_KEY`: Your ImgBB API key for image hosting
- Other optional settings

### 3. Run the Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
- Install dependencies
- Build the TypeScript code
- Set up the logs directory
- Prepare the systemd service file

### 4. Install as a System Service

Follow the instructions displayed by the deploy script:

```bash
sudo cp daily-runners.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable daily-runners.service
sudo systemctl start daily-runners.service
```

### 5. Check Service Status

```bash
sudo systemctl status daily-runners.service
```

### 6. View Logs

Logs are stored in both the system journal and in the logs directory:

```bash
# View system logs
sudo journalctl -u daily-runners.service

# View application logs
ls -la logs/
cat logs/2023-05-24.log  # Replace with current date
```

## Testing the Application

You can run the application in test mode to verify it works correctly:

```bash
./deploy.sh test
```

This will run the application with the test flag, sending notifications only to test users.

## Monitoring the Web Interface

The application runs a web server that displays its status. You can access it at:

```
http://your-server-ip:3000
```

You can also manually trigger the daily process by visiting:

```
http://your-server-ip:3000/run
```

For security, consider setting up Nginx or another reverse proxy with SSL in front of the application.

## Customizing the Schedule

By default, the application runs daily at midnight UTC. To change this:

1. Edit the `index.ts` file
2. Modify the cron schedule expression in the production mode section
3. Rebuild the application with `npm run build`
4. Restart the service with `sudo systemctl restart daily-runners.service`

## Troubleshooting

### Canvas Installation Issues

If you encounter problems with the canvas library, try:

```bash
npm rebuild canvas --update-binary
```

### Permissions Issues

Make sure your application has write access to its directory:

```bash
sudo chown -R youruser:youruser /path/to/daily-runners
```

### Service Not Starting

Check the logs for detailed error messages:

```bash
sudo journalctl -u daily-runners.service -n 50
``` 