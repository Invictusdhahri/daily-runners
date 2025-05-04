# Daily Trending Tokens Runner on Replit

This project is configured to run on Replit, automatically generating and sending trending token information to users via Intercom on a scheduled basis.

## Features
- **Daily Scheduled Runs**: Automatically runs at midnight UTC every day in production mode
- **Test Mode**: Can be run in test mode with 1-minute intervals for quick testing
- **Web Dashboard**: Simple web interface showing the service status and next scheduled run

## Setup Instructions

### 1. Environment Variables
Set up the following environment variables in the Replit Secrets tab:

- `INTERCOM_TOKEN`: Your Intercom API token
- `INTERCOM_ADMIN_ID`: The Intercom admin ID to send messages from
- `TEST_USER_IDS`: Comma-separated list of Intercom user IDs for testing (only used in test mode)
- Other environment variables needed for image generation and Intercom integration

### 2. Running the Service

#### Production Mode
The default mode runs the service once every 24 hours at midnight UTC:

```bash
npm run start
```

#### Test Mode
For testing, run in test mode which executes every 1 minute and only sends messages to the test users:

```bash
npm run test-mode
```

### 3. Keeping the Replit Running
This project includes an Express web server that keeps your Replit alive. For even more reliability, you can use:

1. **Replit Always On**: Enable this in your Replit settings
2. **UptimeRobot**: Set up a monitor to ping your Replit URL every few minutes

## Project Structure

- `index.ts`: Main entry point that sets up the scheduler and web server
- `dailyRunner.ts`: Contains the core logic for generating images and sending messages
- `generateImage.ts`: Handles the generation of trending token images
- `intercom-api.ts`: Handles communication with the Intercom API
- `imgbb-uploader.ts`: Uploads generated images to ImgBB for hosting

## Debugging

- Check the Replit console for logs and error messages
- Visit the root URL of your Replit to see the dashboard with status information
- Use test mode to quickly verify functionality without waiting 24 hours

## Troubleshooting

- **Missing Environment Variables**: Ensure all required environment variables are set in Replit Secrets
- **Image Generation Failures**: Check if canvas dependencies are properly installed
- **Intercom API Issues**: Verify your API token and permissions 