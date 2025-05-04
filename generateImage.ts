import Jimp from 'jimp';
import * as fs from 'fs';
import * as path from 'path';
import { getTrendingPools, SimplifiedPoolInfo } from './trending-tokens';

const WIDTH = 1080;
const HEIGHT = 1080;
// Black box area (from template):
const BOX_LEFT = 180;
const BOX_TOP = 200;
const BOX_WIDTH = 750;
const BOX_HEIGHT = 840;
const NUM_TOKENS = 5;
const ITEM_HEIGHT = Math.floor(BOX_HEIGHT / (NUM_TOKENS + 1)); // leave some padding at top/bottom
const IMAGE_SIZE = 56;
const IMAGE_X = BOX_LEFT + 32;
const NAME_X = IMAGE_X + IMAGE_SIZE + 24;
const CHANGE_X = BOX_LEFT + BOX_WIDTH - 60; // right-aligned for change
const PRICE_X = BOX_LEFT + BOX_WIDTH - 60; // right-aligned for price
const TEXT_COLOR = 0xFFFFFFFF; // white
const SUBTEXT_COLOR = 0xAAAAAAAA; // light gray
const GREEN = 0x2ECC40FF; // green

async function drawTrendingTokensImage() {
  try {
    // Load template background
    const templatePath = path.join(__dirname, 'template.png');
    const image = await Jimp.read(templatePath);

    // Load a font for text
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    // Fetch a larger pool of tokens to ensure we can fill 5 valid ones
    const RAW_POOL_SIZE = 20;
    const tokens = (await getTrendingPools())
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
      .slice(0, RAW_POOL_SIZE);

    // Only keep tokens whose images load successfully (up to NUM_TOKENS)
    const validTokens: typeof tokens = [];
    for (let i = 0; i < tokens.length && validTokens.length < NUM_TOKENS; i++) {
      try {
        await Jimp.read(tokens[i].image_url);
        validTokens.push(tokens[i]);
      } catch {
        continue;
      }
    }

    // Calculate vertical centering
    const totalListHeight = ITEM_HEIGHT * validTokens.length;
    const startY = BOX_TOP + Math.floor((BOX_HEIGHT - totalListHeight) / 2);

    // Draw tokens (only those with valid images)
    for (let i = 0; i < validTokens.length; i++) {
      const y = startY + i * ITEM_HEIGHT;
      const token = validTokens[i];

      try {
        // Draw token image (guaranteed to load)
        const tokenImage = await Jimp.read(token.image_url);
        tokenImage.resize(IMAGE_SIZE, IMAGE_SIZE);
        
        // Create a circular mask for the token
        const mask = new Jimp(IMAGE_SIZE, IMAGE_SIZE, 0x00000000);
        mask.circle(); // Create a circular mask
        
        // Apply the mask to the token image
        tokenImage.mask(mask, 0, 0);
        
        // Composite the token image on the main image
        image.composite(tokenImage, IMAGE_X, y);

        // Draw token name (Jimp has limited text capabilities)
        image.print(fontLarge, NAME_X, y, token.coin_name || 'Unknown');

        // Draw volume
        const volumeText = `$${(Number(token.volume_24h) / 1e6).toFixed(1)}M volume`;
        image.print(fontSmall, NAME_X, y + 34, volumeText);

        // Draw price change
        const change = Number(token.price_change_24h);
        if (change > 0) {
          const changeStr = `+${change.toFixed(2)}%`;
          // Jimp doesn't have right-aligned text, so we'll position it manually
          const textWidth = Jimp.measureText(fontMedium, changeStr);
          image.print(fontMedium, CHANGE_X - textWidth, y, changeStr);
        }

        // Draw market cap
        const marketCap = Number(token.market_cap);
        const marketCapStr = marketCap >= 1e6 
          ? `$${(marketCap / 1e6).toFixed(1)}M` 
          : marketCap >= 1e3 
            ? `$${(marketCap / 1e3).toFixed(0)}K` 
            : `$${marketCap.toFixed(0)}`;
        const mcapWidth = Jimp.measureText(fontMedium, marketCapStr);
        image.print(fontMedium, PRICE_X - mcapWidth, y + 34, marketCapStr);
      } catch (error) {
        console.error(`Error processing token ${token.coin_name}:`, error);
      }
    }

    // Save image
    const outputPath = path.join(__dirname, 'output.png');
    await image.writeAsync(outputPath);
    
    console.log('Image saved successfully as output.png');
    
    // Output the token data to be captured by dailyRunner.ts
    console.log('TOKENS_DATA_START');
    console.log(JSON.stringify(validTokens));
    console.log('TOKENS_DATA_END');
    
    return validTokens;
  } catch (error) {
    console.error('Error in drawTrendingTokensImage:', error);
    throw error;
  }
}

// Export the function to make it usable from other files
export { drawTrendingTokensImage };

// Only execute if this file is run directly
if (require.main === module) {
  drawTrendingTokensImage().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}