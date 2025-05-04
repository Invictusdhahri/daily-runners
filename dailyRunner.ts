import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import { uploadImageToS3 } from './imageUploader';
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
    console.log('Step 2: Uploading image to S3...');
    let imageUrl;
    try {
      imageUrl = await uploadImageToS3();
      console.log(`Image uploaded successfully. URL: ${imageUrl}`);
    } catch (error) {
      console.error('Error uploading to S3:', error);
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

async function processBatch(
  users: { id: string }[], 
  intercom: IntercomApi, 
  message: string, 
  concurrency: number
): Promise<{ successes: number, errors: number }> {
  let successCount = 0;
  let errorCount = 0;
  let activeTasks = 0;
  let userIndex = 0;
  
  return new Promise((resolve) => {
    // Function to process the next user
    async function processNextUser() {
      if (userIndex >= users.length || activeTasks >= concurrency) {
        // If all tasks are done, resolve the promise
        if (userIndex >= users.length && activeTasks === 0) {
          resolve({ successes: successCount, errors: errorCount });
        }
        return;
      }
      
      // Get the next user
      const user = users[userIndex++];
      activeTasks++;
      
      try {
        await intercom.sendInAppMessage(user.id, message);
        successCount++;
      } catch (error) {
        // Log errors, but continue processing
        errorCount++;
        console.error(`Error sending message to user ${user.id}:`, error);
      } finally {
        activeTasks--;
        // Process next user
        processNextUser();
      }
    }
    
    // Start processing users up to concurrency limit
    for (let i = 0; i < concurrency && userIndex < users.length; i++) {
      processNextUser();
    }
  });
}

// Run the main function
runDailyProcess().catch(error => {
  console.error('Fatal error in daily runner:', error);
  process.exit(1);
}); 