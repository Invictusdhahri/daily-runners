import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { getTrendingPools, SimplifiedPoolInfo } from './trending-tokens';

const WIDTH = 1080;
const HEIGHT = 1080;
const ITEM_HEIGHT = 140; // Increased height for better spacing
const IMAGE_SIZE = 80; // Increased image size
const TEXT_COLOR = '#fff';
const SUBTEXT_COLOR = '#aaa';
const GREEN = '#2ecc40';

// Calculate center position
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const TOKENS_START_Y = CENTER_Y - (ITEM_HEIGHT * 2.5); // Start 2.5 items above center
const LEFT_MARGIN = 200; // Distance from center to left content
const RIGHT_MARGIN = 200; // Distance from center to right content

async function drawTrendingTokensImage() {
  try {
    console.log('Starting image generation...');
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Load and draw the template image as the background
    const templatePath = path.join(__dirname, 'template.png');
    console.log('Attempting to load template from:', templatePath);
    
    try {
      const templateImg = await loadImage(templatePath);
      console.log('Template loaded successfully:', templateImg.width, templateImg.height);
      ctx.drawImage(templateImg, 0, 0, WIDTH, HEIGHT);
    } catch (error) {
      console.error('Error loading template image:', error);
      throw error;
    }

    // Fetch tokens
    const tokens = (await getTrendingPools()).slice(0, 5);

    for (let i = 0; i < tokens.length; i++) {
      const y = TOKENS_START_Y + i * ITEM_HEIGHT;
      const token = tokens[i];

      // Token image
      let img;
      try {
        if (!token.image_url) {
          throw new Error('No image URL provided');
        }
        img = await loadImage(token.image_url);
      } catch (error) {
        console.warn(`Failed to load image for token ${token.coin_name}:`, error);
        img = await loadImage('https://via.placeholder.com/80x80?text=?');
      }

      // Draw token image
      ctx.save();
      ctx.beginPath();
      ctx.arc(CENTER_X - LEFT_MARGIN, y + 40, IMAGE_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, CENTER_X - LEFT_MARGIN - IMAGE_SIZE/2, y, IMAGE_SIZE, IMAGE_SIZE);
      ctx.restore();

      // Coin name
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(token.coin_name || 'Unknown Token', CENTER_X - LEFT_MARGIN + 60, y + 40);

      // Market cap
      ctx.font = '18px Arial';
      ctx.fillStyle = SUBTEXT_COLOR;
      const marketCap = token.market_cap ? `$${Number(token.market_cap).toLocaleString()}` : 'N/A';
      ctx.fillText(`Market Cap: ${marketCap}`, CENTER_X - LEFT_MARGIN + 60, y + 70);

      // Price
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = GREEN;
      const price = token.coin_price ? `$${Number(token.coin_price).toPrecision(4)}` : 'N/A';
      ctx.fillText(price, CENTER_X + RIGHT_MARGIN - 100, y + 50);
    }

    // Save to file
    const outputPath = path.join(__dirname, 'output.png');
    console.log('Saving output to:', outputPath);
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createPNGStream();
    await new Promise((resolve, reject) => {
      (stream as any).on('data', (chunk: any) => out.write(chunk));
      (stream as any).on('end', () => {
        out.end();
        console.log('Image saved successfully as output.png');
        resolve(null);
      });
      (stream as any).on('error', (error: any) => {
        console.error('Error saving image:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error in drawTrendingTokensImage:', error);
    throw error;
  }
}

drawTrendingTokensImage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});