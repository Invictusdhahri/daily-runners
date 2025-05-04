# Daily Runners VPS Deployment Guide

This guide provides instructions for deploying the Daily Runners application on a Virtual Private Server (VPS).

## Prerequisites

- A Linux VPS (Ubuntu/Debian recommended)
- Node.js 18 or higher
- npm
- Sudo/root access for service installation

## Deployment Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/daily-runners.git
cd daily-runners
```

### 2. Run the Deployment Script

The deployment script will:
- Install required system dependencies
- Install Node.js dependencies
- Build the TypeScript code
- Set up a systemd service to keep the application running

```bash
# Make the script executable
chmod +x deploy.sh

# Run with sudo for system-level operations
sudo ./deploy.sh
```

If you want to run in test mode (runs every minute) instead of production mode (runs daily):

```bash
sudo ./deploy.sh test
```

### 3. Configure Your Environment Variables

If you didn't set up the environment variables during deployment:

```bash
nano .env
```

Fill in the required values:
- `INTERCOM_TOKEN`: Your Intercom API token
- `INTERCOM_ADMIN_ID`: Your Intercom admin ID
- `IMGBB_API_KEY`: Your ImgBB API key for image hosting

Then restart the service:

```bash
sudo systemctl restart daily-runners.service
```

### 4. Verify Service Status

```bash
sudo systemctl status daily-runners.service
```

You should see output indicating the service is active (running).

### 5. Access the Web Dashboard

The application runs a web server that shows its status. Access it at:

```
http://your-vps-ip:3000
```

You can also manually trigger a run by visiting:

```
http://your-vps-ip:3000/run
```

## Security Considerations

### Firewall Configuration

By default, the application runs on port 3000. You should configure your firewall to allow access:

```bash
# Using UFW (Ubuntu)
sudo ufw allow 3000/tcp

# Using firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Setting Up a Reverse Proxy (Recommended)

For better security, consider setting up Nginx as a reverse proxy with SSL:

1. Install Nginx:
   ```bash
   sudo apt install nginx
   ```

2. Set up an Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/daily-runners
   ```

3. Add this configuration:
   ```
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/daily-runners /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Add HTTPS with Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Monitoring and Logs

### Viewing Logs

```bash
# View service logs
sudo journalctl -u daily-runners.service

# View recent logs with follow
sudo journalctl -u daily-runners.service -f

# Application-specific logs
ls -la logs/
cat logs/$(date +%Y-%m-%d).log
```

### Monitoring the Service

You can set up monitoring using a tool like Monit:

```bash
sudo apt install monit
sudo nano /etc/monit/conf.d/daily-runners
```

Add:
```
check process daily-runners
  with pidfile "/var/run/daily-runners.pid"
  start program = "/bin/systemctl start daily-runners.service"
  stop program = "/bin/systemctl stop daily-runners.service"
  if failed port 3000 protocol http for 3 cycles then restart
  if 3 restarts within 5 cycles then alert
```

Restart Monit:
```bash
sudo systemctl restart monit
```

## Troubleshooting

### Service Won't Start

Check for errors in the logs:
```bash
sudo journalctl -u daily-runners.service -n 50 --no-pager
```

### Image Generation Issues

If there are problems with image generation:
```bash
# Verify dependencies are installed
sudo apt install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Rebuild canvas
npm rebuild canvas --update-binary
```

### Scheduled Jobs Not Running

Check if cron is working:
```bash
# Test the application manually
node dist/index.js --test

# Check the system time
date
``` 