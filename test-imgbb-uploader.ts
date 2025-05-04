import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import { uploadImageToImgBB } from './imgbb-uploader';
import { execSync } from 'child_process';
import { SimplifiedPoolInfo } from './trending-tokens';

// Load environment variables from .env file
dotenv.config();

// Constants
const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // The test user ID
const IMAGE_PATH = path.join(__dirname, 'output.png');

// Predefined list of top tokens with their addresses
const TOP_TOKENS: SimplifiedPoolInfo[] = [
  {
    coin_name: "Solana",
    token_address: "So11111111111111111111111111111111111111112",
    coin_price: "0",
    market_cap: "0",
    volume_24h: "0",
    dex_name: "",
    liquidity: "0",
    image_url: "",
    holders: 0,
    price_change_24h: "0"
  },
  {
    coin_name: "Bonk",
    token_address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    coin_price: "0",
    market_cap: "0",
    volume_24h: "0",
    dex_name: "",
    liquidity: "0",
    image_url: "",
    holders: 0,
    price_change_24h: "0"
  },
  {
    coin_name: "Jupiter",
    token_address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    coin_price: "0",
    market_cap: "0",
    volume_24h: "0",
    dex_name: "",
    liquidity: "0",
    image_url: "",
    holders: 0,
    price_change_24h: "0"
  },
  {
    coin_name: "Raydium",
    token_address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    coin_price: "0",
    market_cap: "0",
    volume_24h: "0",
    dex_name: "",
    liquidity: "0",
    image_url: "",
    holders: 0,
    price_change_24h: "0"
  },
  {
    coin_name: "Jito",
    token_address: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    coin_price: "0",
    market_cap: "0",
    volume_24h: "0",
    dex_name: "",
    liquidity: "0",
    image_url: "",
    holders: 0,
    price_change_24h: "0"
  }
];

/**
 * Test the ImgBB uploader and send a message to the test user
 */
async function testImgBBUploaderAndMessage() {
  console.log('Testing improved ImgBB uploader and message sending...');
  console.log(`Test User ID: ${TEST_USER_ID}`);
  
  try {
    // Step 1: Generate or check for the image
    console.log('Step 1: Checking for image...');
    if (!fs.existsSync(IMAGE_PATH)) {
      console.log('Image not found, generating now...');
      await generateImage();
    } else {
      console.log('Image already exists, using the existing one.');
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
    const messageContent = getMessageContent(imageUrl, TOP_TOKENS);
    
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
async function generateImage(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Run the image generation script
      execSync('npm run generate-image', { stdio: 'inherit' });
      
      // Verify the image was created
      if (!fs.existsSync(IMAGE_PATH)) {
        return reject(new Error('Image generation failed: output file not found'));
      }
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Create a message with the image URL for Intercom
 */
function getMessageContent(imageUrl: string, tokenData: SimplifiedPoolInfo[]): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create the token list HTML
  let tokenListHtml = '';
  if (tokenData.length > 0) {
    tokenListHtml = '<table style="width:100%; margin-top:15px; border-collapse:collapse;">';
    tokenListHtml += '<tr style="border-bottom:1px solid #eee; color:#333; font-weight:bold;"><th style="text-align:left; padding:8px;">Token</th><th style="text-align:left; padding:8px;">Address</th></tr>';
    
    for (const token of tokenData) {
      tokenListHtml += `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px; font-weight:500;">${token.coin_name}</td>
        <td style="padding:8px; font-family:monospace; color:#555;">${token.token_address}</td>
      </tr>`;
    }
    
    tokenListHtml += '</table>';
  }
  
  return `
    <h2 style="color:#333; font-size:18px; margin-bottom:10px;">Your Daily Trending Tokens Update</h2>
    <p style="margin-bottom:15px;">Here are the top 5 trending tokens for ${currentDate}:</p>
    <div style="text-align:center; margin:15px 0;">
      <img src="${imageUrl}" alt="Trending Tokens Today" style="max-width:100%; width:300px; border-radius:8px; border:1px solid #eee;" />
    </div>
    ${tokenListHtml}
    <p style="margin-top:15px;">Track these tokens and more on our platform daily!</p>
  `;
}

// Run the test function
testImgBBUploaderAndMessage().catch(error => {
  console.error('Fatal error in test:', error);
  process.exit(1);
});