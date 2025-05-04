import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const API_URL = 'https://api.intercom.io/contacts';

// Test user details - customize as needed
const TEST_USER = {
  role: 'user',
  external_id: `test_user_${Date.now()}`, // Generate a unique ID
  email: 'test@example.com',              // Replace with your test email
  name: 'Test User',
  signed_up_at: Math.floor(Date.now() / 1000),
  custom_attributes: {
    is_test_account: true
  }
};

async function createTestUser() {
  console.log('Creating test user in Intercom...');
  
  if (!INTERCOM_TOKEN) {
    console.error('INTERCOM_TOKEN environment variable is required');
    process.exit(1);
  }
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Intercom API error (${response.status}): ${errorText}`);
    }
    
    const user = await response.json();
    
    console.log('✅ Test user created successfully!');
    console.log('-------------------------------');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log('-------------------------------');
    console.log('You can now use this ID in your test-intercom.ts script.');
    
    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

// Run the function
createTestUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 