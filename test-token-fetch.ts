import { getTrendingPools, SimplifiedPoolInfo } from './trending-tokens';

async function testTokenFetch() {
  try {
    console.log('Fetching trending tokens...');
    const tokens = await getTrendingPools();

    console.log(`Retrieved ${tokens.length} tokens in total`);
    
    // Filter and sort tokens as done in generateImage.ts
    const filteredTokens = tokens
      .filter(token => 
        Number(token.market_cap) > 100000 && 
        Number(token.price_change_24h) > 0 &&
        token.coin_name?.trim() &&
        token.image_url?.trim() &&
        !token.image_url.toLowerCase().includes('placeholder') &&
        !token.image_url.toLowerCase().includes('default')
      )
      .filter((token, index, self) =>
        index === self.findIndex(t => t.coin_name?.toLowerCase() === token.coin_name?.toLowerCase())
      )
      .slice(0, 20);
    
    console.log(`Filtered to ${filteredTokens.length} valid tokens`);
    
    // Sort by market cap and get top 5
    const topTokens = filteredTokens
      .sort((a, b) => parseFloat(b.market_cap) - parseFloat(a.market_cap))
      .slice(0, 5);
    
    console.log('\n===== TOP 5 TOKENS (BY MARKET CAP) =====');
    topTokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.coin_name} (${token.token_address})`);
      console.log(`   Market Cap: $${Number(token.market_cap).toLocaleString()}`);
      console.log(`   Price Change: ${token.price_change_24h}%`);
      console.log(`   Volume 24h: $${Number(token.volume_24h).toLocaleString()}`);
      console.log('   -----------------------');
    });
    
    console.log('\nToken data for copy-paste:');
    topTokens.forEach(token => {
      console.log(`{
  coin_name: "${token.coin_name}",
  token_address: "${token.token_address}",
  coin_price: "${token.coin_price}",
  market_cap: "${token.market_cap}",
  volume_24h: "${token.volume_24h}",
  dex_name: "${token.dex_name}",
  liquidity: "${token.liquidity}",
  image_url: "${token.image_url}",
  holders: ${token.holders},
  price_change_24h: "${token.price_change_24h}"
},`);
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
  }
}

testTokenFetch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 