import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const INTERCOM_TOKEN = process.env.INTERCOM_TOKEN;
const ADMIN_ID = process.env.INTERCOM_ADMIN_ID;
const TEST_USER_ID = '671ecd6fe457bce823c4c979'; // The user ID you found

// Use an image from a trusted, widely-accessible CDN
// This is more likely to be allowed by Intercom's security settings
const SAMPLE_IMAGE_URL = 'https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_960_720.png';

async function sendImageMessage() {
  console.log('Testing message with external image to Intercom user...');
  
  if (!INTERCOM_TOKEN) {
    console.error('INTERCOM_TOKEN environment variable is required');
    return;
  }
  
  if (!ADMIN_ID) {
    console.error('INTERCOM_ADMIN_ID environment variable is required');
    return;
  }
  
  // Create a more structured message with proper HTML formatting
  const messageBody = `
    <h2 style="color:#333; font-size:18px; margin-bottom:10px;">Your Daily Token Update - Test</h2>
    <p style="margin-bottom:15px;">Here is your daily crypto update:</p>
    <div style="text-align:center; margin:15px 0;">
      <img src="${SAMPLE_IMAGE_URL}" alt="Ethereum Token" style="max-width:100%; width:300px; border-radius:8px; border:1px solid #eee;" />
    </div>
    <p style="margin-top:15px;">This is a test message from the daily runner. The image above should be visible.</p>
  `;
  
  const url = 'https://api.intercom.io/messages';
  const payload = {
    message_type: 'inapp',
    body: messageBody,
    from: { type: 'admin', id: ADMIN_ID },
    to: { type: 'user', id: TEST_USER_ID }
  };
  
  try {
    console.log('Sending message with external image...');
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
    console.log('✅ Message with image sent successfully!');
    console.log(`Message ID: ${result.id || 'N/A'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

// Run the function
sendImageMessage().then(() => {
  console.log('Test complete. Check your Intercom messenger to see the message.');
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 