# Daily Runners - Trending Tokens

A TypeScript-based tool to fetch and monitor trending token pools on the Solana blockchain using the GeckoTerminal API. It also includes functionality to automatically send daily Intercom messages with trending tokens to all your users.

## Features

- Fetches trending token pools from Solana network
- Filters pools by minimum liquidity ($1000)
- Provides detailed information for each pool:
  - Coin name
  - Current price
  - Market cap
  - 24h trading volume
  - DEX name (supports multiple Solana DEXes)
  - Liquidity
  - Token address
  - Token image
  - Number of holders
  - 24h price change percentage
- Generates a daily image with trending tokens
- Automatically uploads the image to AWS S3
- Sends personalized daily Intercom messages to all users with the trending tokens image

## Installation

1. Clone this repository:
```bash
git clone https://github.com/your-username/daily-runners.git
cd daily-runners
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the provided example:
```bash
cp env.example .env
```

4. Configure your environment variables in the `.env` file:
- Add your Intercom API token and Admin ID
- Add AWS credentials for S3 image upload

## Usage

### Generate Daily Image Only

```bash
npm run generate-image
```

### Run the Complete Daily Process

This will generate the image, upload it to S3, and send messages to all users in Intercom:

```bash
npm run daily-complete
```

### Individual Steps

You can also run each step separately:

```bash
# Generate the image
npm run generate-image

# Send daily messages (requires IMAGE_URL or S3 configuration)
npm run send-daily-message
```

## Setting Up Scheduled Runs

To automate the daily process, you can set up a cron job or use a scheduler service.

### Example Cron Job

Add the following to your crontab to run the process daily at 8:00 AM:

```
0 8 * * * cd /path/to/daily-runners && npm run daily-complete
```

## Intercom Setup

Before using the Intercom messaging feature, you need to:

1. Create a Private App in Intercom Developer Hub
2. Get your Access Token and Admin ID
3. Ensure your token has proper permissions to send messages

## Example Response

The trending tokens function returns an array of token objects with the following structure:
```json
{
  "coin_name": "Example Token",
  "coin_price": "0.00643694808709027",
  "market_cap": "6491700.17328602",
  "volume_24h": "2383274.81130946",
  "dex_name": "Raydium",
  "liquidity": "920081.0507",
  "token_address": "CniPCE4b3s8gSUPhUiyMjXnytrEqUrMfSsnbBjLCpump",
  "image_url": "https://coin-images.coingecko.com/coins/images/54690/large/example.png",
  "holders": 22272,
  "price_change_24h": "5.25"
}
```

## Supported DEXes

The tool supports multiple Solana DEXes including:
- Raydium
- Orca
- Jupiter

## Implementation Details

- Uses GeckoTerminal API for token data fetching
- Uses Intercom API for sending daily messages to users
- Implements caching for token information to reduce API calls
- Processes pools in parallel with a limit of 5 concurrent requests
- Filters out pools with liquidity less than $1000
- Uses AWS S3 for image hosting

## Requirements

- Node.js 14.x or higher
- npm or yarn
- Internet connection for API access
- Intercom account with API access
- AWS account with S3 access (for image hosting)
 