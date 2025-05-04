import * as fs from 'fs';
import { getBase64EncodedImage, createMessageWithBase64Image } from './base64ImageHelper';

console.log('Testing Base64 image encoding...');

try {
  // Test getBase64EncodedImage function
  const base64String = getBase64EncodedImage();
  
  // Check if it's a valid data URL
  if (base64String.startsWith('data:image/png;base64,')) {
    console.log('✅ Base64 encoding successful');
    
    // Calculate size of base64 string
    const sizeInKB = (base64String.length / 1024).toFixed(2);
    console.log(`Base64 string size: ${sizeInKB} KB`);
    
    // Show a sample of the base64 string
    console.log(`Sample of Base64 string: ${base64String.substring(0, 50)}...`);
    
    // Test creating a message with the base64 image
    const message = createMessageWithBase64Image('Test message with embedded image');
    console.log('✅ Message with Base64 image created successfully');
    console.log(`Message length: ${message.length} characters`);
    
    // Save a sample message to a file for inspection
    fs.writeFileSync('sample-message.html', message);
    console.log('✅ Sample message saved to sample-message.html');
  } else {
    console.log('❌ Base64 string is not in the expected format');
  }
} catch (error) {
  console.error('❌ Error testing Base64 encoding:', error);
}

console.log('Base64 encoding test complete'); 