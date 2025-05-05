import * as dotenv from 'dotenv';
import { IntercomApi, IntercomUser, IntercomApiOptions } from './intercom-api';

// Load environment variables
dotenv.config();

async function sendMessagesToActiveUsers() {
  console.log('====== SENDING MESSAGES TO ACTIVE INTERCOM USERS ======');
  
  // Validate required environment variables
  if (!process.env.INTERCOM_TOKEN || !process.env.INTERCOM_ADMIN_ID) {
    console.error('ERROR: Missing required environment variables: INTERCOM_TOKEN and INTERCOM_ADMIN_ID');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Activity window - how far back to look for active users
  const activityDays = args.length > 0 && !isNaN(parseInt(args[0])) 
    ? parseInt(args[0]) 
    : process.env.ACTIVITY_DAYS 
      ? parseInt(process.env.ACTIVITY_DAYS, 10) 
      : 30;
  
  // Debugging flag - use --debug or set DEBUG=true in env
  const isDebug = args.includes('--debug') || process.env.DEBUG === 'true';
  
  // Dry run mode - doesn't actually send messages
  const isDryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
  
  // Max users to message - useful for testing or limiting batches
  const maxUsersArg = args.find(arg => arg.startsWith('--max-users='));
  const maxUsers = maxUsersArg 
    ? parseInt(maxUsersArg.split('=')[1], 10) 
    : process.env.MAX_USERS 
      ? parseInt(process.env.MAX_USERS, 10) 
      : 0; // 0 means no limit
  
  // Number of pages to fetch (each page is typically 150 users)
  const maxPagesArg = args.find(arg => arg.startsWith('--max-pages='));
  let maxPages = maxPagesArg 
    ? parseInt(maxPagesArg.split('=')[1], 10) 
    : args.includes('--all-pages') 
      ? 0 // Fetch all pages
      : process.env.MAX_PAGES 
        ? parseInt(process.env.MAX_PAGES, 10) 
        : 5; // Default to 5 pages
  
  // If user specifies --all-pages, override maxPages
  if (args.includes('--all-pages')) {
    maxPages = 0; // 0 means fetch all pages
  }
  
  // Get message content from env or default
  const messageContent = process.env.MESSAGE_CONTENT || 'Hello! This is an automated message from our team.';
  
  console.log(`Activity window: ${activityDays} days`);
  console.log(`Debug mode: ${isDebug ? 'ON' : 'OFF'}`);
  console.log(`Dry run: ${isDryRun ? 'ON (no messages will be sent)' : 'OFF'}`);
  console.log(`Max users to message: ${maxUsers > 0 ? maxUsers : 'No limit'}`);
  console.log(`Max pages to fetch: ${maxPages > 0 ? maxPages : 'All pages'}`);
  
  // Initialize Intercom API
  const apiOptions: IntercomApiOptions = {
    batchSize: 150,
    rateLimitDelay: 300,
    debug: isDebug,
    maxPages: maxPages
  };
  
  const intercom = new IntercomApi(
    process.env.INTERCOM_TOKEN!,
    process.env.INTERCOM_ADMIN_ID!,
    apiOptions
  );
  
  console.log('\n[1] Fetching active users...');
  const startActiveUsers = Date.now();
  const allActiveUsers = await intercom.listActiveUsers(activityDays);
  const activeUsersDuration = Date.now() - startActiveUsers;
  
  if (allActiveUsers.length === 0) {
    console.log('No active users found. Exiting.');
    return;
  }
  
  // Apply the maxUsers limit if specified
  const activeUsers = maxUsers > 0 && maxUsers < allActiveUsers.length
    ? allActiveUsers.slice(0, maxUsers)
    : allActiveUsers;
    
  console.log(`✅ Found ${allActiveUsers.length} active users (took ${activeUsersDuration}ms)`);
  
  if (maxUsers > 0 && maxUsers < allActiveUsers.length) {
    console.log(`ℹ️ Limiting to first ${maxUsers} users as requested`);
  }
  
  if (isDebug) {
    console.log('\nSample of active users:');
    activeUsers.slice(0, 5).forEach((user: IntercomUser, index: number) => {
      console.log(`${index + 1}. User ID: ${user.id}${user.email ? `, Email: ${user.email}` : ''}`);
    });
  }
  
  // Send messages to active users
  console.log(`\n[2] Sending messages to ${activeUsers.length} users...`);
  
  let successCount = 0;
  let failureCount = 0;
  const failedUsers: Array<{userId: string, email?: string, error: string}> = [];
  
  for (let i = 0; i < activeUsers.length; i++) {
    const user = activeUsers[i];
    const progress = ((i + 1) / activeUsers.length * 100).toFixed(1);
    
    try {
      if (isDebug) {
        console.log(`\nSending to user ${i + 1}/${activeUsers.length} (${progress}%)`);
        console.log(`User ID: ${user.id}${user.email ? `, Email: ${user.email}` : ''}`);
      } else if (i % 10 === 0 || i === activeUsers.length - 1) {
        // Progress update every 10 users if not in debug mode
        process.stdout.write(`\rProgress: ${i + 1}/${activeUsers.length} (${progress}%)`);
      }
      
      if (!isDryRun) {
        await sendIntercomMessage(intercom, user.id, messageContent);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      successCount++;
    } catch (error: unknown) {
      failureCount++;
      failedUsers.push({
        userId: user.id,
        email: user.email,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (isDebug) {
        console.error(`❌ Failed to send message to user ${user.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  // Final summary
  console.log('\n\n====== SUMMARY ======');
  console.log(`Total active users found: ${allActiveUsers.length}`);
  if (maxUsers > 0 && maxUsers < allActiveUsers.length) {
    console.log(`Users processed (limited): ${activeUsers.length}`);
  }
  console.log(`Successful sends: ${successCount}`);
  console.log(`Failed sends: ${failureCount}`);
  
  if (failureCount > 0 && isDebug) {
    console.log('\nFailed users:');
    failedUsers.forEach((failure, index) => {
      console.log(`${index + 1}. User ID: ${failure.userId}${failure.email ? `, Email: ${failure.email}` : ''}`);
      console.log(`   Error: ${failure.error}`);
    });
  }
  
  if (isDryRun) {
    console.log('\nThis was a DRY RUN - no messages were actually sent.');
  }
  
  console.log('\n====== COMPLETED ======');
}

async function sendIntercomMessage(intercom: IntercomApi, userId: string, message: string): Promise<any> {
  return await intercom.sendMessage(userId, message);
}

// Run the function
sendMessagesToActiveUsers().catch(error => {
  console.error('Fatal error occurred:', error);
  process.exit(1);
}); 