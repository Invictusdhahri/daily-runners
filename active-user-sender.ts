import * as dotenv from 'dotenv';
import { IntercomApi, IntercomUser, IntercomApiOptions } from './intercom-api';

// Load environment variables
dotenv.config();

export interface ActiveUserSenderOptions {
  activityDays?: number;
  isDryRun?: boolean;
  isDebug?: boolean;
  maxUsers?: number;
  maxPages?: number;
  batchSize?: number;
  customMessage?: string;
}

/**
 * Sends a message to active Intercom users
 * @param messageContent The message content to send to users
 * @param options Configuration options
 * @returns Promise that resolves when all messages have been sent
 */
export async function sendMessagesToActiveUsers(
  messageContent: string,
  options: ActiveUserSenderOptions = {}
): Promise<{ total: number, success: number, failed: number }> {
  // Set default values for options
  const activityDays = options.activityDays || 30;
  const isDryRun = options.isDryRun !== undefined ? options.isDryRun : false;
  const isDebug = options.isDebug !== undefined ? options.isDebug : false;
  const maxUsers = options.maxUsers || 0; // 0 means no limit
  const maxPages = options.maxPages || 0; // 0 means fetch all pages
  const batchSize = options.batchSize || 150;
  
  console.log('====== SENDING MESSAGES TO ACTIVE INTERCOM USERS ======');
  console.log(`Activity window: ${activityDays} days`);
  console.log(`Debug mode: ${isDebug ? 'ON' : 'OFF'}`);
  console.log(`Dry run: ${isDryRun ? 'ON (no messages will be sent)' : 'OFF'}`);
  console.log(`Max users to message: ${maxUsers > 0 ? maxUsers : 'No limit'}`);
  console.log(`Max pages to fetch: ${maxPages > 0 ? maxPages : 'All pages'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Message length: ${messageContent.length} characters`);
  
  // Validate required environment variables
  if (!process.env.INTERCOM_TOKEN || !process.env.INTERCOM_ADMIN_ID) {
    console.error('ERROR: Missing required environment variables: INTERCOM_TOKEN and INTERCOM_ADMIN_ID');
    throw new Error('Missing required environment variables: INTERCOM_TOKEN and INTERCOM_ADMIN_ID');
  }
  
  // Initialize Intercom API
  console.log(`\nInitializing Intercom API...`);
  const apiOptions: IntercomApiOptions = {
    batchSize,
    rateLimitDelay: 300,
    debug: isDebug,
    maxPages
  };
  
  const intercom = new IntercomApi(
    process.env.INTERCOM_TOKEN,
    process.env.INTERCOM_ADMIN_ID,
    apiOptions
  );
  
  console.log('\n[1] Fetching active users...');
  console.log(`API token set (first 5 chars): ${process.env.INTERCOM_TOKEN?.substring(0, 5)}...`);
  console.log(`Admin ID: ${process.env.INTERCOM_ADMIN_ID}`);
  
  // Start timing the fetch
  const startActiveUsers = Date.now();
  
  console.log(`Querying Intercom for users active in the last ${activityDays} days...`);
  const allActiveUsers = await intercom.listActiveUsers(activityDays);
  const activeUsersDuration = Date.now() - startActiveUsers;
  
  console.log(`Active users API call completed in ${activeUsersDuration}ms`);
  
  if (allActiveUsers.length === 0) {
    console.log('No active users found. Exiting.');
    return { total: 0, success: 0, failed: 0 };
  }
  
  // Apply the maxUsers limit if specified
  const activeUsers = maxUsers > 0 && maxUsers < allActiveUsers.length
    ? allActiveUsers.slice(0, maxUsers)
    : allActiveUsers;
    
  console.log(`✅ Found ${allActiveUsers.length} active users (took ${activeUsersDuration}ms)`);
  
  if (maxUsers > 0 && maxUsers < allActiveUsers.length) {
    console.log(`ℹ️ Limiting to first ${maxUsers} users as requested`);
  }
  
  console.log('\nSample of active users:');
  activeUsers.slice(0, 5).forEach((user: IntercomUser, index: number) => {
    console.log(`${index + 1}. User ID: ${user.id}${user.email ? `, Email: ${user.email}` : ''}${user.name ? `, Name: ${user.name}` : ''}`);
  });
  
  // Send messages to active users
  console.log(`\n[2] Sending messages to ${activeUsers.length} users...`);
  
  let successCount = 0;
  let failureCount = 0;
  const failedUsers: Array<{userId: string, email?: string, error: string}> = [];
  
  const startSending = Date.now();
  
  // Calculate estimated time to complete
  const estimatedTimePerUser = 250; // ms, including sending and delay
  const estimatedTotalTimeMs = activeUsers.length * estimatedTimePerUser;
  const estimatedTotalTimeMins = Math.ceil(estimatedTotalTimeMs / 60000);
  
  console.log(`Starting to send messages. Estimated time to complete: ~${estimatedTotalTimeMins} minute${estimatedTotalTimeMins !== 1 ? 's' : ''}`);
  console.log(`Sending will ${isDryRun ? 'be simulated (dry run)' : 'actually send messages'}`);
  
  for (let i = 0; i < activeUsers.length; i++) {
    const user = activeUsers[i];
    const progress = ((i + 1) / activeUsers.length * 100).toFixed(1);
    const elapsedTime = Date.now() - startSending;
    const estimatedTimeLeft = ((activeUsers.length - i - 1) * estimatedTimePerUser);
    
    // Only show detailed logs for first few users and at regular intervals
    const showDetailedLog = i < 5 || i % 10 === 0 || i === activeUsers.length - 1;
    
    if (showDetailedLog) {
      console.log(`\nUser ${i + 1}/${activeUsers.length} (${progress}%) - Est. ${Math.ceil(estimatedTimeLeft / 60000)}m remaining`);
      if (isDebug) {
        console.log(`User ID: ${user.id}${user.email ? `, Email: ${user.email}` : ''}${user.name ? `, Name: ${user.name}` : ''}`);
      }
    } else {
      // Simple progress update
      process.stdout.write(`\rProgress: ${i + 1}/${activeUsers.length} (${progress}%)`);
    }
    
    try {
      if (!isDryRun) {
        // Actual send
        await intercom.sendMessage(user.id, messageContent);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (showDetailedLog) {
        // In dry run mode with detailed logging
        console.log(`🔵 Dry run - would have sent to user ${user.id}`);
      }
      
      successCount++;
    } catch (error: unknown) {
      failureCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      failedUsers.push({
        userId: user.id,
        email: user.email,
        error: errorMessage
      });
      
      console.error(`❌ Failed to send message to user ${user.id}: ${errorMessage}`);
    }
  }
  
  const totalSendingTime = Date.now() - startSending;
  
  // Final summary
  console.log('\n\n====== SUMMARY ======');
  console.log(`Total active users found: ${allActiveUsers.length}`);
  if (maxUsers > 0 && maxUsers < allActiveUsers.length) {
    console.log(`Users processed (limited): ${activeUsers.length}`);
  }
  console.log(`Successful sends: ${successCount}`);
  console.log(`Failed sends: ${failureCount}`);
  console.log(`Total processing time: ${(totalSendingTime / 1000).toFixed(2)} seconds`);
  console.log(`Average time per user: ${(totalSendingTime / activeUsers.length).toFixed(2)} ms`);
  
  if (failureCount > 0) {
    console.log('\nFailed users sample:');
    failedUsers.slice(0, 5).forEach((failure, index) => {
      console.log(`${index + 1}. User ID: ${failure.userId}${failure.email ? `, Email: ${failure.email}` : ''}`);
      console.log(`   Error: ${failure.error}`);
    });
    
    if (failedUsers.length > 5) {
      console.log(`... and ${failedUsers.length - 5} more failures.`);
    }
  }
  
  if (isDryRun) {
    console.log('\nThis was a DRY RUN - no messages were actually sent.');
  }
  
  console.log('\n====== COMPLETED ======');
  
  return {
    total: activeUsers.length,
    success: successCount,
    failed: failureCount
  };
} 