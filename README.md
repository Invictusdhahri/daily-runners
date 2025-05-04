# Daily Trending Tokens Runner

This project automatically generates images of trending tokens and sends them to users via Intercom on a scheduled basis (daily in production, every minute in test mode).

## Features

- **Image Generation**: Creates visualizations of trending tokens
- **Multiple Test Users**: Support for testing with multiple users in test mode
- **Scheduled Execution**: Uses node-cron for scheduling
- **Web Dashboard**: Simple web interface showing the service status

## Deployment Options

### Fly.io Deployment

This project can be easily deployed on Fly.io. Follow these steps:

1. **Install Fly CLI**

```bash
# For macOS
brew install flyctl

# For Linux
curl -L https://fly.io/install.sh | sh

# For Windows (using PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

2. **Login to Fly.io**

```bash
fly auth login
```

3. **Deploy to Fly.io**

```bash
# Navigate to the project directory
cd daily-runners

# Launch the app on Fly.io
fly launch

# During launch setup:
# - Choose a unique app name or use the suggested one
# - Select your preferred organization and region
# - Say YES to creating a volume for data persistence
```

4. **Set Environment Variables**

```bash
fly secrets set INTERCOM_TOKEN=your_intercom_token_here \
                INTERCOM_ADMIN_ID=your_intercom_admin_id \
                IMGBB_API_KEY=your_imgbb_api_key_here \
                DATA_DIR=/app/data
```

5. **Deploy the App**

```bash
fly deploy
```

6. **Monitor the App**

```bash
# View logs
fly logs

# SSH into the VM if needed
fly ssh console

# Access the app in browser
fly open
```

### VPS Deployment (Recommended)

For detailed instructions on deploying this service on a VPS, see [README-VPS.md](README-VPS.md).

The VPS deployment method:
- Provides more reliability and control
- Can be customized to your server environment
- Runs as a systemd service for automatic restart
- Includes monitoring and logging capabilities

### Local Development

#### 1. Install Dependencies

```bash
# Install required system packages (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Install Node.js packages
npm install
```

#### 2. Environment Variables

Create a `.env` file in the project root:

```
# Intercom API Credentials
INTERCOM_TOKEN=your_intercom_token_here
INTERCOM_ADMIN_ID=your_intercom_admin_id

# ImgBB API Configuration (Required)
IMGBB_API_KEY=your_imgbb_api_key_here

# Testing Configuration
# Comma-separated list of user IDs for testing
TEST_USER_IDS=user_id_1,user_id_2,user_id_3
```

#### 3. Running the Service

**Production Mode** (runs once every 24 hours at midnight UTC):

```bash
npm run start
```

**Test Mode** (runs every minute, only sends to test users):

```bash
npm run test-mode
```

## Project Structure

- `index.ts`: Main entry point that sets up the scheduler and web server
- `dailyRunner.ts`: Contains the core logic for generating images and sending messages
- `generateImage.ts`: Handles the generation of trending token images
- `intercom-api.ts`: Handles communication with the Intercom API
- `imgbb-uploader.ts`: Uploads generated images to ImgBB for hosting

## Available Commands

- `npm run generate-image`: Generate the trending tokens image only
- `npm run send-daily-message`: Send the daily message only
- `npm run daily`: Run the full daily process once
- `npm run test-imgbb`: Test the ImgBB image uploader
- `npm run start`: Start the scheduled service (runs at midnight UTC daily)
- `npm run test-mode`: Start in test mode (runs every minute)
- `npm run build`: Build the TypeScript code

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: 
   - Ensure all required environment variables are set in the `.env` file
   - The IMGBB_API_KEY is required for image uploads

2. **TypeScript Errors**: 
   - If you get TypeScript errors about missing modules, make sure all dependencies are installed:
   ```bash
   npm install
   npm install @types/node-cron @types/express --save-dev
   ```

3. **Intercom API Issues**:
   - Verify your API token has permissions to send messages
   - Check that the admin ID is correct

4. **ImgBB Upload Failures**:
   - Verify your ImgBB API key is correct
   - Ensure the image file exists and is accessible
   - Check network connectivity to ImgBB API

### Testing Workflow

1. Run in test mode: `npm run test-mode`
2. Check the console for success/error messages
3. Verify that test users receive messages in Intercom
4. Check image generation and upload success in logs

## License

MIT
 