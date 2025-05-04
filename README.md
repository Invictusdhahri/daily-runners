# Daily Runners - Token Update Messages

A system that generates and sends daily token update messages to users via Intercom, with embedded images.

## Features

- Generates a daily token update image
- Uploads the image to ImgBB for hosting
- Sends messages to all users via Intercom with the embedded image
- Handles batching and rate limiting for large user bases
- Provides fallback mechanisms for error handling

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:

```
# Intercom API credentials
INTERCOM_TOKEN=your_intercom_api_token_here
INTERCOM_ADMIN_ID=your_intercom_admin_id_here

# ImgBB API credentials
IMGBB_API_KEY=your_imgbb_api_key_here
```

## Usage

### Test the image upload system

```
npm run test-imgbb
```

This will:
1. Generate a test image (or use an existing one)
2. Upload it to ImgBB
3. Send a message to the test user with the image

### Run the full daily process

```
npm run daily
```

This will:
1. Generate the daily image
2. Upload it to ImgBB
3. Send messages to all users in batches

### Run individual steps

You can also run each part of the process separately:

```
# Just generate the image
npm run generate-image

# Just send messages (requires existing image)
npm run send-daily-message
```

## Environment Variables

- `INTERCOM_TOKEN`: Your Intercom API token
- `INTERCOM_ADMIN_ID`: Your Intercom admin ID
- `IMGBB_API_KEY`: Your ImgBB API key

## Getting an ImgBB API Key

1. Register for an account at [ImgBB](https://imgbb.com/)
2. Go to your account dashboard
3. Navigate to API settings to get your API key

## Troubleshooting

If images aren't appearing in Intercom messages:

1. Check that your ImgBB API key is valid
2. Ensure the ImgBB account has hosting permissions
3. Try the `test-imgbb-uploader.ts` script to test the upload functionality
4. If all else fails, the system will fall back to a reliable public image URL

## Directory Structure

- `dailyRunner.ts` - Main script for the daily process
- `generateImage.ts` - Generates the daily token image
- `trending-tokens.ts` - Gets token data for the image
- `imgbb-uploader.ts` - Image upload functionality
- `intercom-api.ts` - Intercom API client
- `sendDailyMessage.ts` - Script to send messages with existing images
- `test-imgbb-uploader.ts` - Test script for the ImgBB uploader
 