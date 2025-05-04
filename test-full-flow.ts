import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

// Constants
const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const IMAGE_PATH = path.join(__dirname, 'output.png');
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // Your test user ID
const SAMPLE_IMAGE_URL = 'https://via.placeholder.com/500x300?text=Daily+Token+Update';

async function testFullFlow() {
  console.log('🔍 Testing daily runner flow with a single user...');
  console.log('=================================================');
  
  try {
    // Step 1: Generate the image
    console.log('\n📊 STEP 1: Generating daily image...');
    await generateImage();
    
    // Step 2: We'll simulate S3 upload with a placeholder image
    console.log('\n🖼️ STEP 2: Simulating image hosting (using placeholder)...');
    const imageUrl = SAMPLE_IMAGE_URL;
    console.log(`Using image URL: ${imageUrl}`);
    
    // Step 3: Send message to test user
    console.log('\n💬 STEP 3: Sending message to test user...');
    await sendMessageToTestUser(imageUrl);
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
  } catch (error) {
    console.error('\n❌ Error in test flow:', error);
    process.exit(1);
  }
}

async function generateImage(): Promise<void> {
  // Check if image already exists
  if (fs.existsSync(IMAGE_PATH)) {
    const stats = fs.statSync(IMAGE_PATH);
    console.log('✅ Image already exists, skipping generation');
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    return;
  }
  
  try {
    console.log('Generating image...');
    execSync('npm run generate-image', { stdio: 'inherit' });
    
    if (fs.existsSync(IMAGE_PATH)) {
      const stats = fs.statSync(IMAGE_PATH);
      console.log('✅ Image generated successfully');
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('❌ Image generation failed: output.png not found');
      throw new Error('Image generation failed');
    }
  } catch (error) {
    console.error('❌ Error in image generation:', error);
    throw error;
  }
}

async function sendMessageToTestUser(imageUrl: string): Promise<void> {
  // Validate environment variables
  if (!INTERCOM_TOKEN || !ADMIN_ID) {
    throw new Error('INTERCOM_TOKEN and INTERCOM_ADMIN_ID environment variables are required');
  }
  
  // Create message content
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const messageContent = `
    <h2>Your Daily Trending Tokens Update - TEST</h2>
    <p>Here are the trending tokens for ${currentDate}:</p>
    <img src="${imageUrl}" alt="Trending Tokens Today" style="width: 100%; max-width: 500px;" />
    <p>This is a test of the complete daily runner flow.</p>
  `;
  
  // Initialize Intercom API client
  const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
  
  try {
    console.log(`Sending message to user ID: ${TEST_USER_ID}`);
    await intercom.sendInAppMessage(TEST_USER_ID, messageContent);
    console.log('✅ Message sent successfully to test user');
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// Run the test
testFullFlow().then(() => {
  console.log('Test complete.');
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 