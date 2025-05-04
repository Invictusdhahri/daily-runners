import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

// Check if output.png exists
const imagePath = path.join(__dirname, 'output.png');

console.log('Testing image upload flow...');

if (fs.existsSync(imagePath)) {
  console.log(`✅ Image file exists at: ${imagePath}`);
  
  // Get file size
  const stats = fs.statSync(imagePath);
  console.log(`Image size: ${(stats.size / 1024).toFixed(2)} KB`);
  
  // Check if we have mock S3 credentials set
  if (process.env.S3_BUCKET_NAME) {
    console.log(`✅ S3 bucket name configured: ${process.env.S3_BUCKET_NAME}`);
  } else {
    console.log('❌ Missing S3_BUCKET_NAME in .env file');
  }
  
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_aws_access_key') {
    console.log('✅ AWS credentials found');
  } else {
    console.log('❌ Missing or default AWS credentials in .env file');
  }
  
  // Generate test public URL to simulate successful upload
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `daily-tokens-${dateStr}.png`;
  const mockUrl = process.env.S3_BUCKET_NAME 
    ? `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`
    : 'https://example-bucket.s3.amazonaws.com/test-image.png';
    
  console.log(`📝 If upload successful, image would be available at: ${mockUrl}`);
  
  // Mock successful upload
  console.log('✅ Mock upload completed successfully');
} else {
  console.log(`❌ Image file not found at: ${imagePath}`);
  console.log('Run "npm run generate-image" first to create the image');
}

// Test complete
console.log('Image upload test complete'); 