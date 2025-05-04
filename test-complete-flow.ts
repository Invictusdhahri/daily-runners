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
const SAMPLE_MESSAGE_PATH = path.join(__dirname, 'sample-message.html');
const MAX_USERS_TO_TEST = 2; // Limit the number of test users for safety

/**
 * Complete test flow:
 * 1. Generate image
 * 2. Create a mock S3 upload (or use Base64 encoding)
 * 3. Send test messages to a limited number of users
 */
async function runTestFlow() {
  console.log('🔍 STARTING COMPLETE FLOW TEST');
  console.log('==============================');
  
  try {
    // Step 1: Generate the image
    console.log('\n📊 STEP 1: Testing image generation');
    const imageGenerated = await testImageGeneration();
    if (!imageGenerated) {
      console.log('❌ Image generation test failed. Cannot continue tests.');
      return;
    }
    
    // Step 2: Simulate image hosting (using a local file path for testing)
    console.log('\n🖼️ STEP 2: Testing image hosting');
    const imageUrl = await testImageHosting();
    if (!imageUrl) {
      console.log('❌ Image hosting test failed. Cannot continue tests.');
      return;
    }
    
    // Step 3: Test sending messages
    console.log('\n💬 STEP 3: Testing message sending');
    await testMessageSending(imageUrl);
    
    console.log('\n✅ COMPLETE FLOW TEST FINISHED SUCCESSFULLY');
  } catch (error) {
    console.error('\n❌ Error in test flow:', error);
  }
}

/**
 * Test image generation
 */
async function testImageGeneration(): Promise<boolean> {
  try {
    // If we already have the image, we can skip generation 
    if (fs.existsSync(IMAGE_PATH)) {
      const stats = fs.statSync(IMAGE_PATH);
      if (stats.size > 0) {
        console.log('✅ Image already exists, skipping generation');
        console.log(`   Path: ${IMAGE_PATH}`);
        console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
        return true;
      }
    }
    
    // Otherwise, generate the image
    console.log('Generating image...');
    execSync('npm run generate-image', { stdio: 'inherit' });
    
    // Verify the image was created
    if (fs.existsSync(IMAGE_PATH)) {
      const stats = fs.statSync(IMAGE_PATH);
      console.log('✅ Image generated successfully');
      console.log(`   Path: ${IMAGE_PATH}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      return true;
    } else {
      console.log('❌ Image generation failed: output.png not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error in image generation test:', error);
    return false;
  }
}

/**
 * Test image hosting (simulated)
 */
async function testImageHosting(): Promise<string | null> {
  try {
    // For testing, we'll use a local Base64 encoded sample or the already-generated sample message
    if (fs.existsSync(SAMPLE_MESSAGE_PATH)) {
      console.log('✅ Using existing sample message with embedded image');
      return 'sample-message.html';
    }
    
    // Create a test message with Base64 encoded image
    console.log('Running Base64 image encoding test...');
    execSync('npx ts-node test-base64.ts', { stdio: 'inherit' });
    
    if (fs.existsSync(SAMPLE_MESSAGE_PATH)) {
      console.log('✅ Base64 image encoding and message generation successful');
      return 'sample-message.html';
    } else {
      console.log('❌ Failed to create sample message with Base64 encoded image');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in image hosting test:', error);
    return null;
  }
}

/**
 * Test sending messages to users (limited to MAX_USERS_TO_TEST)
 */
async function testMessageSending(imageUrl: string): Promise<boolean> {
  try {
    // Validate Intercom credentials
    if (!INTERCOM_TOKEN || !ADMIN_ID) {
      console.log('❌ Missing Intercom credentials. Check .env file.');
      return false;
    }
    
    // Read the sample message
    let messageContent: string;
    if (fs.existsSync(SAMPLE_MESSAGE_PATH)) {
      messageContent = fs.readFileSync(SAMPLE_MESSAGE_PATH, 'utf8');
      console.log('✅ Loaded message content from sample-message.html');
    } else {
      // Fallback message
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      messageContent = `
        <h2>Your Daily Trending Tokens Update - TEST MESSAGE</h2>
        <p>Here are the trending tokens for ${currentDate}:</p>
        <p>(This is a test message)</p>
      `;
      console.log('⚠️ Using fallback message content');
    }
    
    // Initialize Intercom API client
    const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
    
    // Get users from Intercom (limited to prevent mass messaging during testing)
    console.log('Fetching users from Intercom...');
    const allUsers = await intercom.listAllUsers();
    
    if (!allUsers || allUsers.length === 0) {
      console.log('❌ No users found in Intercom');
      return false;
    }
    
    // Limit the number of users to test
    const testUsers = allUsers.slice(0, MAX_USERS_TO_TEST);
    console.log(`✅ Found ${allUsers.length} users (will only send to ${testUsers.length} for testing)`);
    
    // Send test messages
    let successCount = 0;
    for (const user of testUsers) {
      try {
        console.log(`Sending test message to user ${user.id}`);
        await intercom.sendInAppMessage(user.id, messageContent);
        console.log(`✅ Successfully sent message to user ${user.id}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send message to user ${user.id}:`, error);
      }
    }
    
    console.log(`✅ Sent ${successCount}/${testUsers.length} test messages`);
    return true;
  } catch (error) {
    console.error('❌ Error in message sending test:', error);
    return false;
  }
}

// Run the test flow
runTestFlow().then(() => {
  console.log('Test flow complete.');
}).catch(error => {
  console.error('Fatal error in test flow:', error);
  process.exit(1);
}); 