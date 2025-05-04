import * as cron from 'node-cron';
import express from 'express';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { runDailyProcess } from './dailyRunner';
import { IntercomApi } from './intercom-api';

// Load environment variables
dotenv.config();

// Determine if we're in test mode
const isTestMode = process.argv.includes('--test');
console.log(`Starting in ${isTestMode ? 'TEST' : 'PRODUCTION'} mode`);

// Express server to keep the repl alive
const app = express();
const PORT = process.env.PORT || 3000;

// Basic route for health check
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>Daily Runners Service</h1>
    <p>Status: Running in ${isTestMode ? 'TEST MODE (1 minute interval)' : 'PRODUCTION MODE (24 hour interval)'}</p>
    <p>Last run: ${lastRunTime ? new Date(lastRunTime).toLocaleString() : 'Never'}</p>
    <p>Next run: ${getNextRunTime()}</p>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep track of last run time
let lastRunTime: number | null = null;

// Function to get next scheduled run time
function getNextRunTime(): string {
  if (isTestMode) {
    // In test mode, next run is 1 minute after last run (or now if never run)
    const baseTime = lastRunTime || Date.now();
    return new Date(baseTime + 60000).toLocaleString();
  } else {
    // In production mode, next run is at midnight UTC
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toLocaleString();
  }
}

// Function to run the daily process
async function runScheduledProcess() {
  console.log(`Running scheduled process at ${new Date().toLocaleString()}`);
  
  try {
    // If test mode, only send to test users
    if (isTestMode) {
      console.log('TEST MODE: Running with test users only');
      await runTestProcess();
    } else {
      // Run the normal daily process
      await runDailyProcess();
    }
    
    // Update last run time
    lastRunTime = Date.now();
    console.log(`Process completed successfully at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Error during scheduled process:', error);
  }
}

// Function to run the test process with only test users
async function runTestProcess() {
  // Check if test user IDs are defined
  const testUserIdsString = process.env.TEST_USER_IDS;
  if (!testUserIdsString) {
    console.error('TEST_USER_IDS environment variable is not set!');
    return;
  }
  
  // Parse the comma-separated list of test user IDs
  const testUserIds = testUserIdsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  if (testUserIds.length === 0) {
    console.error('No valid test user IDs found!');
    return;
  }
  
  console.log(`Found ${testUserIds.length} test users: ${testUserIds.join(', ')}`);
  
  // Import necessary functions directly from dailyRunner
  const { generateImage, getMessageContent } = await import('./dailyRunner');
  
  try {
    // Generate the image (same as in production)
    console.log('Generating test image...');
    const trendingTokens = await generateImage();
    
    // Upload the image to ImgBB (using the function from dailyRunner)
    console.log('Uploading test image...');
    const { uploadImageToImgBB } = await import('./imgbb-uploader');
    const imageUrl = await uploadImageToImgBB('./output.png');
    
    // Initialize Intercom API
    const intercom = new IntercomApi(
      process.env.INTERCOM_TOKEN || '',
      process.env.INTERCOM_ADMIN_ID || ''
    );
    
    // Get message content and add test mode notice
    const messageContent = getMessageContent(imageUrl, trendingTokens);
    const testMessage = `
      <div style="background-color:#ffe6e6; padding:10px; border-radius:5px; margin-bottom:15px;">
        <strong>TEST MODE NOTIFICATION</strong> - Sent at ${new Date().toLocaleString()}
      </div>
      ${messageContent}
    `;
    
    // Send the test message to each test user
    let successCount = 0;
    for (const userId of testUserIds) {
      try {
        console.log(`Sending test message to user ID: ${userId}`);
        await intercom.sendInAppMessage(userId, testMessage);
        successCount++;
      } catch (error) {
        console.error(`Error sending message to test user ${userId}:`, error);
      }
    }
    
    console.log(`Test messages sent successfully to ${successCount} out of ${testUserIds.length} users`);
  } catch (error) {
    console.error('Error in test process:', error);
    throw error;
  }
}

// Set up the cron job based on mode
if (isTestMode) {
  // Test mode: run every minute
  cron.schedule('* * * * *', runScheduledProcess);
  console.log('Scheduled to run every minute for testing');
} else {
  // Production mode: run at midnight UTC (00:00)
  cron.schedule('0 0 * * *', runScheduledProcess);
  console.log('Scheduled to run daily at midnight UTC');
}

// Run immediately on startup if in test mode
if (isTestMode) {
  console.log('Test mode: Running immediately...');
  runScheduledProcess();
} 