import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import { uploadImageToImgBB } from './imgbb-uploader';
import { execSync } from 'child_process';

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
    const messageContent = getMessageContent(imageUrl);
    
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
function getMessageContent(imageUrl: string): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
    <h2 style="color:#333; font-size:18px; margin-bottom:10px;">Your Daily Trending Tokens Update</h2>
    <p style="margin-bottom:15px;">Here are the trending tokens for ${currentDate}:</p>
    <div style="text-align:center; margin:15px 0;">
      <img src="${imageUrl}" alt="Trending Tokens Today" style="max-width:100%; width:300px; border-radius:8px; border:1px solid #eee;" />
    </div>
    <p style="margin-top:15px;">Track these tokens and more on our platform daily!</p>
  `;
}

// Run the test function
testImgBBUploaderAndMessage().catch(error => {
  console.error('Fatal error in test:', error);
  process.exit(1);
});