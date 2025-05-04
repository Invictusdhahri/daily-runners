import { createCanvas, loadImage } from 'canvas';
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
const TEXT_COLOR = '#fff';
const SUBTEXT_COLOR = '#aaa';
const GREEN = '#2ecc40';

async function drawTrendingTokensImage() {
  try {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw template background
    const templatePath = path.join(__dirname, 'template.png');
    const templateImg = await loadImage(templatePath);
    ctx.drawImage(templateImg, 0, 0, WIDTH, HEIGHT);

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
        await loadImage(tokens[i].image_url);
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

      // Draw token image (guaranteed to load)
      const img = await loadImage(token.image_url);
      ctx.save();
      ctx.beginPath();
      ctx.arc(IMAGE_X + IMAGE_SIZE / 2, y + IMAGE_SIZE / 2, IMAGE_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, IMAGE_X, y, IMAGE_SIZE, IMAGE_SIZE);
      ctx.restore();

      // Draw token name
      ctx.font = '700 26px Inter, Arial, sans-serif';
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(token.coin_name || 'Unknown', NAME_X, y + 28);

      // Draw volume
      ctx.font = '500 16px Inter, Arial, sans-serif';
      ctx.fillStyle = SUBTEXT_COLOR;
      ctx.fillText(`$${(Number(token.volume_24h) / 1e6).toFixed(1)}M volume`, NAME_X, y + 52);

      // Draw price change
      const change = Number(token.price_change_24h);
      if (change > 0) {
        ctx.font = '700 24px Inter, Arial, sans-serif';
        ctx.fillStyle = GREEN;
        ctx.textAlign = 'right';
        const changeStr = `+${change.toFixed(2)}%`;
        ctx.fillText(changeStr, CHANGE_X, y + 20);
      }

      // Draw market cap
      ctx.font = '500 18px Inter, Arial, sans-serif';
      ctx.fillStyle = TEXT_COLOR;
      const marketCap = Number(token.market_cap);
      const marketCapStr = marketCap >= 1e6 
        ? `$${(marketCap / 1e6).toFixed(1)}M` 
        : marketCap >= 1e3 
          ? `$${(marketCap / 1e3).toFixed(0)}K` 
          : `$${marketCap.toFixed(0)}`;
      ctx.fillText(marketCapStr, PRICE_X, y + 48);
    }

    // Save image
    const outputPath = path.join(__dirname, 'output.png');
    const stream = canvas.createPNGStream();
    const out = fs.createWriteStream(outputPath);
    
    await new Promise<void>((resolve, reject) => {
      stream.pipe(out);
      out.on('finish', () => resolve());
      out.on('error', reject);
    });
    
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