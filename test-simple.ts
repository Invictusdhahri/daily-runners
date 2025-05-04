import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { getBase64EncodedImage } from './base64ImageHelper';

// Load environment variables
dotenv.config();

// Test the setup without sending any real messages
async function testSetup() {
  console.log('🔍 Testing daily runner setup...');
  console.log('=============================');
  
  // Check environment variables
  const envVars = [
    { name: 'INTERCOM_TOKEN', value: process.env.INTERCOM_TOKEN },
    { name: 'INTERCOM_ADMIN_ID', value: process.env.INTERCOM_ADMIN_ID },
    { name: 'AWS_REGION', value: process.env.AWS_REGION },
    { name: 'S3_BUCKET_NAME', value: process.env.S3_BUCKET_NAME },
    { name: 'AWS_ACCESS_KEY_ID', value: process.env.AWS_ACCESS_KEY_ID }
  ];
  
  console.log('\n📋 Checking environment variables:');
  let allEnvVarsSet = true;
  
  for (const env of envVars) {
    if (env.value) {
      // Mask sensitive values
      const isSensitive = env.name.includes('TOKEN') || env.name.includes('KEY');
      const displayValue = isSensitive 
        ? `${env.value.substring(0, 4)}...${env.value.substring(env.value.length - 4)}`
        : env.value;
      console.log(`✅ ${env.name} is set: ${displayValue}`);
    } else {
      console.log(`❌ ${env.name} is NOT set`);
      allEnvVarsSet = false;
    }
  }
  
  // Check image generation
  console.log('\n🖼️ Checking image:');
  const imagePath = path.join(__dirname, 'output.png');
  if (fs.existsSync(imagePath)) {
    const stats = fs.statSync(imagePath);
    console.log(`✅ Image exists: ${imagePath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    // Test base64 encoding
    try {
      const base64Start = getBase64EncodedImage().substring(0, 30);
      console.log(`✅ Base64 encoding works: ${base64Start}...`);
    } catch (error) {
      console.log('❌ Base64 encoding failed:', error);
    }
  } else {
    console.log(`❌ Image not found at: ${imagePath}`);
    console.log('   Run "npm run generate-image" to create the image');
  }
  
  // Summary
  console.log('\n📊 Setup test results:');
  if (allEnvVarsSet) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Some environment variables are missing');
  }
  
  if (fs.existsSync(imagePath)) {
    console.log('✅ Image generation is working');
  } else {
    console.log('❌ Image generation needs to be tested');
  }
  
  console.log('\n🚀 Next steps:');
  console.log('1. Run "npm run generate-image" to test image generation');
  console.log('2. Run "npx ts-node test-intercom.ts" to test sending to a single user');
  console.log('3. Run "npm run daily-complete" to run the full process');
  console.log('4. Set up a scheduled task to run "npm run daily-complete" daily');
}

// Run the test
testSetup().catch(error => {
  console.error('Error in setup test:', error);
}); 