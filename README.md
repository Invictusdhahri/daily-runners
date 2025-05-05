# Daily Trending Tokens Runner

This project automatically generates images of trending tokens and sends them to users via Intercom on a scheduled basis (daily in production, every minute in test mode).

## Intercom User Messaging Tools

This repository now includes tools for managing Intercom user interactions, specifically for:

1. Diagnosing Intercom API connectivity
2. Testing user retrieval
3. Finding active users
4. Sending messages to active users

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/daily-runners.git
cd daily-runners
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the project root with the following content:

```
# Intercom API Credentials
INTERCOM_TOKEN=your_intercom_token_here
INTERCOM_ADMIN_ID=your_intercom_admin_id

# ImgBB API Configuration (Required)
IMGBB_API_KEY=your_imgbb_api_key_here

# Testing Configuration
# Comma-separated list of user IDs for testing
TEST_USER_IDS=user_id_1,user_id_2,user_id_3

# Intercom Messaging Configuration
MESSAGE_CONTENT=Optional custom message to send
ACTIVITY_DAYS=30
DEBUG=false
DRY_RUN=true
```

To get an ImgBB API key:
1. Sign up at https://imgbb.com/
2. Go to your dashboard
3. Access your API key from the account settings

### 4. Running the Service

#### Production Mode
Runs the service once every 24 hours at midnight UTC:

```bash
npm run start
```

#### Test Mode
Runs in test mode which executes every 1 minute and only sends messages to the test users specified in TEST_USER_IDS:

```bash
npm run test-mode
```

## Intercom Tools Usage

### Intercom API Diagnostics

This script diagnoses your Intercom API connection and available endpoints.

```bash
npx ts-node diagnose-intercom.ts
```

### User Retrieval Test

Tests your ability to retrieve users from Intercom.

```bash
npx ts-node test-intercom-users.ts
```

### Active Users Test

Finds users who have been active within a specified time window.

```bash
npx ts-node test-active-users.ts [days] [--all-pages]
```

- `days`: Optional number of days to look back (defaults to 30)
- `--all-pages`: Optional flag to retrieve all pages of users

### Send Messages to Active Users

Sends a message to all users who have been active within a specified time window.

```bash
npx ts-node send-messages-to-active-users.ts [days] [--debug] [--dry-run]
```

Options:
- `days`: Optional number of days to look back (defaults to 30)
- `--debug`: Enable detailed logging
- `--dry-run`: Run without actually sending messages
- `--all-pages`: Retrieve all pages of users instead of limiting to 5 pages

## Features

- **Image Generation**: Creates visualizations of trending tokens
- **Multiple Test Users**: Support for testing with multiple users in test mode
- **Scheduled Execution**: Uses node-cron for scheduling
- **Web Dashboard**: Simple web interface showing the service status
- **Active User Messaging**: New tools for targeting active users with messages

## Running on Replit

For detailed instructions on running this service on Replit, see [README-REPLIT.md](README-REPLIT.md).

## Project Structure

- `index.ts`: Main entry point that sets up the scheduler and web server
- `dailyRunner.ts`: Contains the core logic for generating images and sending messages
- `generateImage.ts`: Handles the generation of trending token images
- `intercom-api.ts`: Handles communication with the Intercom API
- `imgbb-uploader.ts`: Uploads generated images to ImgBB for hosting

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
 