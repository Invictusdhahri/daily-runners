import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import { uploadImageToImgBB } from './imgbb-uploader';
import { execSync } from 'child_process';
import { drawTrendingTokensImage } from './generateImage';
import { SimplifiedPoolInfo } from './trending-tokens';

// Load environment variables from .env file
dotenv.config();

// Constants
const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // The test user ID
const IMAGE_PATH = path.join(__dirname, 'output.png');

/**
 * Test the ImgBB uploader and send a message to the test user
 */
async function testImgBBUploaderAndMessage() {
  console.log('Testing improved ImgBB uploader and message sending...');
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  try {
    // Step 1: Generate or check for the image
    console.log('Step 1: Checking for image...');
    let trendingTokens: SimplifiedPoolInfo[] = [];
    
    if (!fs.existsSync(IMAGE_PATH)) {
      console.log('Image not found, generating now...');
      trendingTokens = await generateImage();
    } else {
      console.log('Image already exists, using the existing one. Regenerating to get token data...');
      trendingTokens = await generateImage();
    }
    
    // Step 2: Upload the image to ImgBB using our new uploader
    console.log('Step 2: Uploading image to ImgBB...');
    const imageUrl = await uploadImageToImgBB(IMAGE_PATH);
    console.log(`Image URL: ${imageUrl}`);
    
    // Step 3: Send message to the test user
    console.log('Step 3: Sending message to test user...');
    
    // Validate environment variables
    if (!INTERCOM_TOKEN) {
      throw new Error('INTERCOM_TOKEN environment variable is required');
    }
    
    if (!ADMIN_ID) {
      throw new Error('INTERCOM_ADMIN_ID environment variable is required');
    }
    
    // Initialize Intercom API client
    const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
    
    // Prepare the message content
    const messageContent = getMessageContent(imageUrl, trendingTokens);
    
    // Send message to test user
    console.log('Sending message to test user...');
    const result = await intercom.sendInAppMessage(TEST_USER_ID, messageContent);
    console.log('✅ Message sent successfully to test user!');
    console.log(`Message ID: ${result.id || 'N/A'}`);
    
    console.log('Test completed successfully at', new Date().toISOString());
  } catch (error) {
    console.error('Error in test process:', error);
    process.exit(1);
  }
}

/**
 * Generate an image for testing
 */
async function generateImage(): Promise<SimplifiedPoolInfo[]> {
  try {
    console.log('Running direct image generation...');
    // Directly call the function instead of using execSync
    const trendingTokens = await drawTrendingTokensImage();
    
    // Verify the image was created
    if (!fs.existsSync(IMAGE_PATH)) {
      throw new Error('Image generation failed: output file not found');
    }
    
    return trendingTokens;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Create a message with the image URL for Intercom
 */
function getMessageContent(imageUrl: string, trendingTokens: SimplifiedPoolInfo[] = []): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate the token list HTML
  let tokenListHtml = '';
  if (trendingTokens && trendingTokens.length > 0) {
    tokenListHtml = '<ul style="list-style-type: none; padding-left: 0; margin-top: 15px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">';
    trendingTokens.slice(0, 5).forEach((token, index) => {
      const price = parseFloat(token.coin_price);
      const formattedPrice = price < 0.01 
        ? price.toExponential(2) 
        : price.toFixed(price < 1 ? 4 : 2);
      
      const change = parseFloat(token.price_change_24h);
      const changeColor = change > 0 ? '#2ecc40' : '#ff4136';
      const changeSign = change > 0 ? '+' : '';
      
      tokenListHtml += `
        <li style="padding: 12px; ${index !== 0 ? 'border-top: 1px solid #eee;' : ''} display: flex; justify-content: space-between; background-color: ${index % 2 === 0 ? '#f8f9fa' : '#fff'};">
          <div>
            <strong style="font-size: 15px;">${index + 1}. ${token.coin_name}</strong>
            <div style="font-size: 13px; color: #666; margin-top: 4px; word-break: break-all;">
              <span>Address: ${token.token_address}</span>
            </div>
          </div>
          <div style="text-align: right; min-width: 80px;">
            <div style="font-weight: bold;">$${formattedPrice}</div>
            <div style="color: ${changeColor}; font-size: 13px;">${changeSign}${change.toFixed(2)}%</div>
          </div>
        </li>
      `;
    });
    tokenListHtml += '</ul>';
  }
  
  return `
    <h2 style="color:#333; font-size:18px; margin-bottom:10px;">Your Daily Trending Tokens Update</h2>
    <p style="margin-bottom:15px;">Here are the trending tokens for ${currentDate}:</p>
    <div style="text-align:center; margin:15px 0;">
      <img src="${imageUrl}" alt="Trending Tokens Today" style="max-width:100%; width:300px; border-radius:8px; border:1px solid #eee;" />
    </div>
    <div style="margin-top:20px;">
      <h3 style="font-size:16px; color:#333; margin-bottom:10px;">Top 5 Trending Tokens:</h3>
      ${tokenListHtml}
    </div>
    <p style="margin-top:20px; font-size:14px; color:#666;">Track these tokens and more on our platform daily!</p>
  `;
}

// Run the test function
testImgBBUploaderAndMessage().catch(error => {
  console.error('Fatal error in test:', error);
  process.exit(1);
});