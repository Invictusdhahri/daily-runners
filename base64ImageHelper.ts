import * as fs from 'fs';
import * as path from 'path';

/**
 * Alternative method for embedding images directly in Intercom messages
 * when S3 or other hosting options are not available.
 * 
 * WARNING: Using Base64 inline images has limitations:
 * 1. It increases the message size significantly
 * 2. Intercom may have message size limits
 * 3. Some email clients may not display Base64 images properly
 * 
 * Use only when direct hosting is not possible.
 */
export function getBase64EncodedImage(imagePath: string = path.join(__dirname, 'output.png')): string {
  try {
    // Check if the image exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at ${imagePath}`);
    }
    
    // Read the image file as binary
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert to Base64
    const base64Image = imageBuffer.toString('base64');
    
    // Create a data URL
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error('Error encoding image to Base64:', error);
    throw error;
  }
}

/**
 * Insert a Base64 image into an HTML message
 * Note: Use this approach only when cloud hosting is not available
 */
export function createMessageWithBase64Image(messageText: string): string {
  try {
    const base64ImageUrl = getBase64EncodedImage();
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `
      <h2>Your Daily Trending Tokens Update</h2>
      <p>Here are the trending tokens for ${currentDate}:</p>
      <img src="${base64ImageUrl}" alt="Trending Tokens Today" style="width: 100%; max-width: 500px;" />
      <p>${messageText}</p>
    `;
  } catch (error) {
    console.error('Error creating message with Base64 image:', error);
    return `
      <h2>Your Daily Trending Tokens Update</h2>
      <p>We couldn't include the trending tokens image today, but you can check them on our platform.</p>
      <p>${messageText}</p>
    `;
  }
} 