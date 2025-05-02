# Daily Runners - Trending Tokens

A TypeScript-based tool to fetch and monitor trending token pools on the Solana blockchain using the GeckoTerminal API.

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

## Usage

1. Import the trending tokens functionality:
```typescript
import { getTrendingPools } from './trending-tokens';
```

2. Use the function to fetch trending tokens:
```typescript
const trendingTokens = await getTrendingPools();
console.log(trendingTokens);
```

## Example Response

The function returns an array of token objects with the following structure:
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

- Uses GeckoTerminal API for data fetching
- Implements caching for token information to reduce API calls
- Processes pools in parallel with a limit of 5 concurrent requests
- Filters out pools with liquidity less than $1000
## Requirements

- Node.js 14.x or higher
- npm or yarn
- Internet connection for API access
 