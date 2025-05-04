import * as path from 'path';
import * as fs from 'fs';
import { IntercomApi } from './intercom-api';
import './generateImage'; // This will run the image generation

// Constants
const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const IMAGE_PATH = path.join(__dirname, 'output.png');
const IMAGE_URL = process.env.IMAGE_URL || ''; // If you have a public URL to host the image
const USER_CHUNK_SIZE = 25; // Process users in batches to avoid overwhelming the API
const MAX_CONCURRENT_SENDS = 5; // Maximum concurrent messages to send

async function waitForImageGeneration(maxWaitTimeMs = 30000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTimeMs) {
    try {
      if (fs.existsSync(IMAGE_PATH)) {
        const stats = fs.statSync(IMAGE_PATH);
        if (stats.size > 0) {
          // Wait an additional second to ensure the file is fully written
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
      }
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error checking for image:', error);
    }
  }
  
  return false;
}

async function sendDailyMessages() {
  // Validate environment variables
  if (!INTERCOM_TOKEN) {
    throw new Error('INTERCOM_TOKEN environment variable is required');
  }
  
  if (!ADMIN_ID) {
    throw new Error('INTERCOM_ADMIN_ID environment variable is required');
  }
  
  // Initialize Intercom API client
  const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
  
  // Wait for image generation to complete
  console.log('Waiting for image generation to complete...');
  const imageGenerated = await waitForImageGeneration();
  if (!imageGenerated) {
    throw new Error('Image generation failed or timed out');
  }
  console.log('Image generation completed successfully.');
  
  // Prepare the message content
  const messageContent = getMessageContent();
  
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

function getMessageContent(): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let imageHtml = '';
  if (IMAGE_URL) {
    // If you have a public URL for the image
    imageHtml = `<img src="${IMAGE_URL}" alt="Trending Tokens Today" style="width: 100%; max-width: 500px;" />`;
  } else {
    // Note: In a real-world implementation, you would need to upload the image
    // to a publicly accessible URL, as Intercom doesn't support direct file uploads
    imageHtml = '<p>(Please configure IMAGE_URL environment variable to show the daily image)</p>';
  }
  
  return `
    <h2>Your Daily Token Update</h2>
    <p>Here are the trending tokens for ${currentDate}:</p>
    ${imageHtml}
    <p>Track these tokens and more on our platform daily!</p>
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
sendDailyMessages().catch(error => {
  console.error('Fatal error in daily message sender:', error);
  process.exit(1);
}); 