import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { getTrendingPools } from './trending-tokens';
const puppeteer = require('puppeteer');

const WIDTH = 1080;
const HEIGHT = 1080;
const ITEM_HEIGHT = 120;
const PADDING = 30;
const IMAGE_SIZE = 60;
const TEXT_COLOR = '#fff';
const SUBTEXT_COLOR = '#aaa';
const GREEN = '#2ecc40';

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

async function generatePuppeteerImage() {
  try {
    console.log('Starting Puppeteer image generation...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Load your HTML file
    await page.goto('file://' + __dirname + '/template.html');

    // Inject tokens data (replace with your actual data)
    const tokens = (await getTrendingPools()).slice(0, 5);
    await page.evaluate((tokens) => {
      const container = document.getElementById('tokens');
      tokens.forEach(token => {
        const div = document.createElement('div');
        div.innerHTML = `<img src="${token.image_url}" style="width:60px;height:60px;border-radius:50%;vertical-align:middle;">
          <span style="font-weight:bold;font-size:24px;margin-left:20px;">${token.coin_name}</span>
          <span style="color:#aaa;font-size:16px;margin-left:10px;">Market Cap: $${Number(token.market_cap).toLocaleString()}</span>
          <span style="color:#2ecc40;font-size:20px;float:right;">$${Number(token.coin_price).toPrecision(4)}</span>`;
        container.appendChild(div);
      });
    }, tokens);

    // Wait for images to load
    await page.waitForTimeout(1000);

    // Screenshot the page
    await page.screenshot({ path: 'output.png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });

    await browser.close();
    console.log('Puppeteer image generation completed successfully');
  } catch (error) {
    console.error('Error in generatePuppeteerImage:', error);
    throw error;
  }
}

drawTrendingTokensImage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

generatePuppeteerImage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});