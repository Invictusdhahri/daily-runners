import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import getTrendingPools from '../trending-tokens/main';

const WIDTH = 600;
const HEIGHT = 700;
const ITEM_HEIGHT = 120;
const PADDING = 30;
const IMAGE_SIZE = 60;
const BG_COLOR = '#101014';
const CARD_COLOR = '#18181c';
const TEXT_COLOR = '#fff';
const SUBTEXT_COLOR = '#aaa';
const GREEN = '#2ecc40';

async function drawTrendingTokensImage() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Card
  ctx.fillStyle = CARD_COLOR;
  ctx.save();
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(PADDING, PADDING + 20);
  ctx.arcTo(WIDTH - PADDING, PADDING, WIDTH - PADDING, HEIGHT - PADDING, 40);
  ctx.arcTo(WIDTH - PADDING, HEIGHT - PADDING, PADDING, HEIGHT - PADDING, 40);
  ctx.arcTo(PADDING, HEIGHT - PADDING, PADDING, PADDING, 40);
  ctx.arcTo(PADDING, PADDING, WIDTH - PADDING, PADDING, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Title
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText('Trending Tokens', PADDING + 20, PADDING + 50);

  // Fetch tokens
  const tokens = (await getTrendingPools()).slice(0, 5);

  for (let i = 0; i < tokens.length; i++) {
    const y = PADDING + 80 + i * ITEM_HEIGHT;
    const token = tokens[i];

    // Token image
    let img;
    try {
      img = await loadImage(token.image_url);
    } catch {
      img = await loadImage('https://via.placeholder.com/60x60?text=?');
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(PADDING + 40, y + 30, IMAGE_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, PADDING + 10, y, IMAGE_SIZE, IMAGE_SIZE);
    ctx.restore();

    // Coin name
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(token.coin_name, PADDING + 90, y + 30);

    // Market cap
    ctx.font = '16px Arial';
    ctx.fillStyle = SUBTEXT_COLOR;
    ctx.fillText(`Market Cap: $${Number(token.market_cap).toLocaleString()}`, PADDING + 90, y + 55);

    // Price
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = GREEN;
    ctx.fillText(`$${Number(token.coin_price).toPrecision(4)}`, WIDTH - PADDING - 150, y + 40);
  }

  // Save to file
  const out = fs.createWriteStream('output.png');
  const stream = canvas.createPNGStream();
  await new Promise((resolve, reject) => {
    (stream as any).on('data', (chunk: any) => out.write(chunk));
    (stream as any).on('end', () => {
      out.end();
      console.log('Image saved as output.png');
      resolve(null);
    });
    (stream as any).on('error', reject);
  });
}

drawTrendingTokensImage();