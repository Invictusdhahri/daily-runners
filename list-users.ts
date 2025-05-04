import * as dotenv from 'dotenv';
import { IntercomApi } from './intercom-api';

// Load environment variables
dotenv.config();

// Constants
const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const LIMIT = 10; // Limit the number of users to display

async function listUsers() {
  console.log('Listing Intercom users...');
  
  // Validate environment variables
  if (!INTERCOM_TOKEN) {
    console.error('INTERCOM_TOKEN environment variable is required');
    return;
  }
  
  if (!ADMIN_ID) {
    console.error('INTERCOM_ADMIN_ID environment variable is required');
    return;
  }
  
  // Initialize Intercom API client
  const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
  
  try {
    // Get users from Intercom
    console.log('Fetching users from Intercom...');
    const users = await intercom.listAllUsers();
    
    if (users && users.length > 0) {
      console.log(`Found ${users.length} users in total`);
      console.log(`Displaying the first ${Math.min(LIMIT, users.length)} users:`);
      console.log('---------------------------------------------');
      
      // Display limited number of users with their IDs
      const limitedUsers = users.slice(0, LIMIT);
      limitedUsers.forEach((user, index) => {
        console.log(`[${index + 1}] User ID: ${user.id}`);
        if (user.email) {
          console.log(`    Email: ${user.email}`);
        }
        console.log('---------------------------------------------');
      });
      
      console.log('\nTo use a specific user ID for testing:');
      console.log('1. Copy the User ID from above');
      console.log('2. Update the TEST_USER_ID in test-intercom.ts');
      console.log('3. Run the test with: npx ts-node test-intercom.ts');
    } else {
      console.log('No users found in Intercom');
    }
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

// Run the function
listUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 