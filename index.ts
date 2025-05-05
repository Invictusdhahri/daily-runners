import * as cron from 'node-cron';
import express from 'express';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { runDailyProcess } from './dailyRunner';
import { IntercomApi } from './intercom-api';

// Load environment variables
dotenv.config();

// Parse command line arguments
const isTestMode = process.argv.includes('--test');
const runImmediately = process.argv.includes('--run-now');
const sendToActive = process.argv.includes('--active-users');
const isDryRun = process.argv.includes('--dry-run');
const isDebug = process.argv.includes('--debug');
const maxUsersArg = process.argv.find(arg => arg.startsWith('--max-users='));
const maxUsers = maxUsersArg ? parseInt(maxUsersArg.split('=')[1], 10) : 0;

// Log startup configuration
console.log('======= DAILY RUNNERS SERVICE STARTING =======');
console.log(`Mode: ${isTestMode ? 'TEST (1 minute interval)' : 'PRODUCTION (daily at midnight)'}`);
console.log(`Target users: ${sendToActive ? 'ACTIVE users only' : 'ALL users'}`);
console.log(`Debug mode: ${isDebug ? 'ON' : 'OFF'}`);
console.log(`Dry run mode: ${isDryRun ? 'ON (no actual messages sent)' : 'OFF'}`);
console.log(`Max users: ${maxUsers > 0 ? maxUsers : 'No limit'}`);
console.log(`Immediate execution: ${runImmediately ? 'YES' : 'NO (waiting for schedule)'}`);

// Express server to keep the repl alive
const app = express();
const PORT = process.env.PORT || 3000;

// Basic route for health check
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <h1>Daily Runners Service</h1>
    <p>Status: Running in ${isTestMode ? 'TEST MODE (1 minute interval)' : 'PRODUCTION MODE (24 hour interval)'}</p>
    <p>User targeting: ${sendToActive ? 'ACTIVE users only' : 'ALL users'}</p>
    <p>Debug mode: ${isDebug ? 'ON' : 'OFF'}</p>
    <p>Dry run mode: ${isDryRun ? 'ON (no messages will be sent)' : 'OFF'}</p>
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
  console.log(`\n======= SCHEDULED PROCESS STARTING =======`);
  console.log(`Timestamp: ${new Date().toLocaleString()}`);
  console.log(`Process ID: ${process.pid}`);
  
  try {
    // Check environment variables
    const hasTokens = !!process.env.INTERCOM_TOKEN && !!process.env.INTERCOM_ADMIN_ID;
    console.log(`Environment check - Intercom tokens: ${hasTokens ? 'FOUND' : 'MISSING'}`);
    
    // If test mode, only send to test users
    if (isTestMode) {
      console.log('\n[TEST MODE] Running with test users only');
      await runTestProcess();
    } else if (sendToActive) {
      // Run with active users only
      console.log('\n[ACTIVE USERS] Running with active users only');
      await runActiveUsersProcess();
    } else {
      // Run the normal daily process
      console.log('\n[ALL USERS] Running with all users');
      await runDailyProcess();
    }
    
    // Update last run time
    lastRunTime = Date.now();
    console.log(`\n======= PROCESS COMPLETED =======`);
    console.log(`Completion time: ${new Date().toLocaleString()}`);
    console.log(`Next scheduled run: ${getNextRunTime()}`);
  } catch (error) {
    console.error('\n======= ERROR IN SCHEDULED PROCESS =======');
    console.error('Error details:', error);
  }
}

// Function to run the test process with only test users
async function runTestProcess() {
  // Check if test user IDs are defined
  const testUserIdsString = process.env.TEST_USER_IDS;
  if (!testUserIdsString) {
    console.error('ERROR: TEST_USER_IDS environment variable is not set!');
    return;
  }
  
  // Parse the comma-separated list of test user IDs
  const testUserIds = testUserIdsString.split(',').map(id => id.trim()).filter(id => id.length > 0);
  
  if (testUserIds.length === 0) {
    console.error('ERROR: No valid test user IDs found!');
    return;
  }
  
  console.log(`Found ${testUserIds.length} test users: ${testUserIds.join(', ')}`);
  
  // Import necessary functions directly from dailyRunner
  console.log('Importing required modules...');
  const { generateImage, getMessageContent } = await import('./dailyRunner');
  
  try {
    // Generate the image (same as in production)
    console.log('\n[1/4] Generating test image...');
    const trendingTokens = await generateImage();
    console.log(`Image generation complete with ${trendingTokens.length} trending tokens`);
    
    // Upload the image to ImgBB (using the function from dailyRunner)
    console.log('\n[2/4] Uploading test image...');
    const { uploadImageToImgBB } = await import('./imgbb-uploader');
    const imageUrl = await uploadImageToImgBB('./output.png');
    console.log(`Image uploaded successfully: ${imageUrl.substring(0, 60)}...`);
    
    // Initialize Intercom API
    console.log('\n[3/4] Initializing Intercom API...');
    const intercom = new IntercomApi(
      process.env.INTERCOM_TOKEN || '',
      process.env.INTERCOM_ADMIN_ID || '',
      { debug: isDebug }
    );
    
    // Get message content and add test mode notice
    console.log('\n[4/4] Preparing and sending test messages...');
    const messageContent = getMessageContent(imageUrl, trendingTokens);
    const testMessage = `
      <div style="background-color:#ffe6e6; padding:10px; border-radius:5px; margin-bottom:15px;">
        <strong>TEST MODE NOTIFICATION</strong> - Sent at ${new Date().toLocaleString()}
      </div>
      ${messageContent}
    `;
    
    // Send the test message to each test user
    let successCount = 0;
    for (let i = 0; i < testUserIds.length; i++) {
      const userId = testUserIds[i];
      try {
        console.log(`Sending to test user ${i+1}/${testUserIds.length}: ${userId}`);
        
        if (!isDryRun) {
          await intercom.sendInAppMessage(userId, testMessage);
          console.log(`✅ Sent successfully to user ${userId}`);
        } else {
          console.log(`🔵 Dry run - would have sent to user ${userId}`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error sending to test user ${userId}:`, error);
      }
    }
    
    console.log(`\nTest messages ${isDryRun ? 'would be' : 'were'} sent successfully to ${successCount} out of ${testUserIds.length} users`);
  } catch (error) {
    console.error('Error in test process:', error);
    throw error;
  }
}

// Function to run the process with active users
async function runActiveUsersProcess() {
  try {
    // Import necessary functions
    console.log('Importing required modules...');
    const { generateImage, getMessageContent } = await import('./dailyRunner');
    
    // Step 1: Generate the image
    console.log('\n[1/3] Generating daily image...');
    const startImageGen = Date.now();
    const trendingTokens = await generateImage();
    console.log(`Image generation completed in ${Date.now() - startImageGen}ms with ${trendingTokens.length} trending tokens.`);
    
    // Step 2: Upload the image to get a public URL
    console.log('\n[2/3] Uploading image to ImgBB...');
    const startUpload = Date.now();
    const { uploadImageToImgBB } = await import('./imgbb-uploader');
    let imageUrl;
    try {
      imageUrl = await uploadImageToImgBB('./output.png');
      console.log(`Image uploaded successfully in ${Date.now() - startUpload}ms.`);
      console.log(`URL: ${imageUrl.substring(0, 60)}...`);
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      const FALLBACK_IMAGE_URL = 'https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_960_720.png';
      console.log(`Using fallback image URL: ${FALLBACK_IMAGE_URL}`);
      imageUrl = FALLBACK_IMAGE_URL;
    }
    
    // Step 3: Send messages to active users
    console.log('\n[3/3] Sending messages to active users...');
    
    // Get active users
    const activityDays = process.env.ACTIVITY_DAYS 
      ? parseInt(process.env.ACTIVITY_DAYS, 10) 
      : 30;
    
    // Import the send-messages-to-active-users functionality
    const { sendMessagesToActiveUsers } = await import('./active-user-sender');
    
    // Prepare the message content
    console.log('Preparing message content...');
    const messageContent = getMessageContent(imageUrl, trendingTokens);
    
    // Send to active users
    console.log(`Starting to send messages to active users (${activityDays} day activity window)...`);
    const result = await sendMessagesToActiveUsers(messageContent, { 
      activityDays, 
      isDryRun: isDryRun,
      isDebug: isDebug,
      maxUsers: maxUsers
    });
    
    console.log(`\nActive users messaging completed: ${result.success} successful, ${result.failed} failed out of ${result.total} total.`);
  } catch (error) {
    console.error('Error in active users process:', error);
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

// Run immediately if specified or in test mode
if (runImmediately || isTestMode) {
  console.log(`Will run immediately as ${runImmediately ? 'requested with --run-now' : 'in test mode'}`);
  // Small delay to allow logs to be read before execution starts
  setTimeout(runScheduledProcess, 1000);
} 