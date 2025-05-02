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

    // Fetch tokens
    const tokens = (await getTrendingPools()).slice(0, NUM_TOKENS);

    // Calculate vertical centering
    const totalListHeight = ITEM_HEIGHT * tokens.length;
    const startY = BOX_TOP + Math.floor((BOX_HEIGHT - totalListHeight) / 2);

    for (let i = 0; i < tokens.length; i++) {
      const y = startY + i * ITEM_HEIGHT;
      const token = tokens[i];

      // Token image
      let img;
      try {
        img = await loadImage(token.image_url);
      } catch {
        img = await loadImage('https://via.placeholder.com/56x56?text=?');
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(IMAGE_X + IMAGE_SIZE / 2, y + IMAGE_SIZE / 2, IMAGE_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, IMAGE_X, y, IMAGE_SIZE, IMAGE_SIZE);
      ctx.restore();

      // Name
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = 'left';
      ctx.fillText(token.coin_name || 'Unknown', NAME_X, y + 28);

      // Volume (gray, under name)
      ctx.font = '16px Arial';
      ctx.fillStyle = SUBTEXT_COLOR;
      ctx.fillText(`$${(Number(token.volume_24h) / 1e6).toFixed(1)}M volume`, NAME_X, y + 52);

      // Price change (green, right-aligned, 24h)
      ctx.font = 'bold 22px Arial';
      ctx.fillStyle = GREEN;
      ctx.textAlign = 'right';
      let change = token.price_change_24h;
      let changeStr = change ? `${Number(change).toFixed(2)}%` : '';
      if (changeStr && !changeStr.startsWith('+') && Number(change) > 0) changeStr = '+' + changeStr;
      ctx.fillText(changeStr, CHANGE_X, y + 20);

      // Price (white, right-aligned, under change)
      ctx.font = '18px Arial';
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(`$${Number(token.coin_price).toPrecision(4)}`, PRICE_X, y + 48);
    }

    // Save to file
    const outputPath = path.join(__dirname, 'output.png');
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    await new Promise((resolve, reject) => {
      (stream as any).on('data', (chunk: any) => out.write(chunk));
      (stream as any).on('end', () => { out.end(); resolve(null); });
      (stream as any).on('error', (error: any) => reject(error));
    });
    console.log('Image saved successfully as output.png');
  } catch (error) {
    console.error('Error in drawTrendingTokensImage:', error);
    throw error;
  }
}

drawTrendingTokensImage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});