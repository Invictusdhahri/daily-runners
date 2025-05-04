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
const IMAGE_PATH = path.join(__dirname, 'output.png');
const USER_CHUNK_SIZE = 25;
const MAX_CONCURRENT_SENDS = 5;
const FALLBACK_IMAGE_URL = 'https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_960_720.png';

async function runDailyProcess() {
  console.log('Daily process started at', new Date().toISOString());
  
  try {
    // Step 1: Generate the image
    console.log('Step 1: Generating daily image...');
    await generateImage();
    console.log('Image generation completed.');
    
    // Step 2: Upload the image to get a public URL
    console.log('Step 2: Uploading image to ImgBB...');
    let imageUrl;
    try {
      imageUrl = await uploadImageToImgBB(IMAGE_PATH);
      console.log(`Image uploaded successfully. URL: ${imageUrl}`);
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      console.log(`Using fallback image URL: ${FALLBACK_IMAGE_URL}`);
      imageUrl = FALLBACK_IMAGE_URL;
    }
    
    // Step 3: Send messages to all users
    console.log('Step 3: Sending messages to all users...');
    await sendMessagesToUsers(imageUrl);
    console.log('All messages sent successfully.');
    
    console.log('Daily process completed successfully at', new Date().toISOString());
  } catch (error) {
    console.error('Error in daily process:', error);
    process.exit(1);
  }
}

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

async function sendMessagesToUsers(imageUrl: string): Promise<void> {
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
  
  // Get all users from Intercom
  console.log('Fetching users from Intercom...');
  const users = await intercom.listAllUsers();
  console.log(`Found ${users.length} users to message.`);
  
  // Process users in chunks to avoid overwhelming the API
  const userChunks = [];
  for (let i = 0; i < users.length; i += USER_CHUNK_SIZE) {
    userChunks.push(users.slice(i, i + USER_CHUNK_SIZE));
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process each chunk of users
  for (let i = 0; i < userChunks.length; i++) {
    const chunk = userChunks[i];
    console.log(`Processing user chunk ${i + 1} of ${userChunks.length} (${chunk.length} users)`);
    
    // Process users in the chunk with limited concurrency
    const results = await processBatch(chunk, intercom, messageContent, MAX_CONCURRENT_SENDS);
    
    // Update counts
    successCount += results.successes;
    errorCount += results.errors;
    
    // Log progress
    console.log(`Chunk ${i + 1} complete. Success: ${results.successes}, Errors: ${results.errors}`);
    
    // Small delay between chunks to avoid rate limiting
    if (i < userChunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('Daily message sending complete.');
  console.log(`Total results: ${successCount} successes, ${errorCount} errors out of ${users.length} users.`);
}

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

// This helper function processes a batch of users with limited concurrency
async function processBatch(
  users: { id: string }[],
  intercom: IntercomApi,
  messageContent: string,
  maxConcurrent: number
): Promise<{ successes: number; errors: number }> {
  // Keep track of results
  let successes = 0;
  let errors = 0;
  
  // Process in batches of maxConcurrent
  for (let i = 0; i < users.length; i += maxConcurrent) {
    const batch = users.slice(i, i + maxConcurrent);
    const promises = batch.map(user => sendMessageToUser(user.id, intercom, messageContent));
    
    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successes++;
      } else {
        errors++;
        console.error(`Error sending message to user: ${result.reason}`);
      }
    });
    
    // Small delay between batches to avoid rate limiting
    if (i + maxConcurrent < users.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return { successes, errors };
}

// Helper function to send a message to a single user
async function sendMessageToUser(
  userId: string,
  intercom: IntercomApi,
  messageContent: string
): Promise<void> {
  try {
    await intercom.sendInAppMessage(userId, messageContent);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

// If this script is run directly (not imported as a module)
if (require.main === module) {
  runDailyProcess().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} 