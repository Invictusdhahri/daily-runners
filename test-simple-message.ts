import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // The user ID you found

async function sendSimpleMessage() {
  console.log('Testing simple message to Intercom user...');
  
  if (!INTERCOM_TOKEN) {
    console.error('INTERCOM_TOKEN environment variable is required');
    return;
  }
  
  if (!ADMIN_ID) {
    console.error('INTERCOM_ADMIN_ID environment variable is required');
    return;
  }
  
  const url = 'https://api.intercom.io/messages';
  const payload = {
    message_type: 'inapp',
    body: '<p>This is a simple test message without any images.</p>',
    from: { type: 'admin', id: ADMIN_ID },
    to: { type: 'user', id: TEST_USER_ID }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INTERCOM_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Intercom API error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Message sent successfully!');
    console.log(`Message ID: ${result.id || 'N/A'}`);
    
    // Response debug information
    console.log('\nIntercom API Response:');
    console.log('Type:', result.type);
    console.log('ID:', result.id);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// Run the function
sendSimpleMessage().then(() => {
  console.log('Test complete.');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 