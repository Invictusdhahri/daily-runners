import * as dotenv from 'dotenv';
import { IntercomApi } from './intercom-api';
import { createMessageWithBase64Image } from './base64ImageHelper';

// Load environment variables
dotenv.config();

const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;

// You can specify a test user ID here after finding it with list-users.ts
// If empty or not specified, the script will use the first user found
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // Replace with a specific user ID for targeted testing

async function testIntercomMessage() {
  console.log('Testing Intercom API...');
  
  if (!INTERCOM_TOKEN) {
    console.log('❌ Missing INTERCOM_TOKEN in .env file');
    return;
  }
  
  if (!ADMIN_ID) {
    console.log('❌ Missing INTERCOM_ADMIN_ID in .env file');
    return;
  }

  console.log('✅ Intercom credentials found');
  
  // Initialize Intercom API client
  const intercom = new IntercomApi(INTERCOM_TOKEN, ADMIN_ID);
  
  // Prepare a test message (using Base64 image for simplicity in testing)
  console.log('Creating test message with embedded image...');
  const messageContent = createMessageWithBase64Image('This is a test message from the daily runner.');
  
  try {
    // If a specific test user ID is provided, use it
    if (TEST_USER_ID) {
      console.log(`Using specified test user ID: ${TEST_USER_ID}`);
      await intercom.sendInAppMessage(TEST_USER_ID, messageContent);
      console.log('✅ Test message sent successfully to specified user');
      return;
    }
    
    // Otherwise, fetch users and use the first one
    console.log('No test user ID specified, fetching users from Intercom...');
    const users = await intercom.listAllUsers();
    
    if (users && users.length > 0) {
      console.log(`✅ Found ${users.length} users`);
      
      // Use the first user for the test
      const testUser = users[0];
      console.log(`Sending test message to user: ${testUser.id}`);
      
      await intercom.sendInAppMessage(testUser.id, messageContent);
      console.log('✅ Test message sent successfully');
      
      // Show hint about using specific user ID
      console.log('\nTip: To test with a specific user, run "npx ts-node list-users.ts"');
      console.log('     then update TEST_USER_ID in this file with the desired user ID.');
    } else {
      console.log('❌ No users found in Intercom');
    }
  } catch (error) {
    console.error('❌ Error sending test message:', error);
  }
}

// Run the test
testIntercomMessage().then(() => {
  console.log('Intercom API test complete');
}).catch(error => {
  console.error('Fatal error in test:', error);
}); 