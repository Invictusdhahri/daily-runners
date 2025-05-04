import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import FormData from 'form-data';

// Load environment variables
dotenv.config();

// Constants and configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const FALLBACK_IMAGE_URL = 'https://cdn.pixabay.com/photo/2021/05/24/09/15/ethereum-6278326_960_720.png';

/**
 * Uploads an image to ImgBB and returns the URL
 * @param imagePath Path to the image file
 * @returns Promise with the image URL
 */
export async function uploadImageToImgBB(imagePath: string): Promise<string> {
  // Validate API key
  if (!IMGBB_API_KEY) {
    console.error('IMGBB_API_KEY not found in environment variables');
    return FALLBACK_IMAGE_URL;
  }

  try {
    console.log(`Reading image file: ${imagePath}`);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Image file not found at: ${imagePath}`);
      return FALLBACK_IMAGE_URL;
    }
    
    // Create a FormData instance
    const formData = new FormData();
    
    // Add the API key to FormData
    formData.append('key', IMGBB_API_KEY);
    
    // Add the image file directly from the file system
    formData.append('image', fs.createReadStream(imagePath));
    
    console.log('Image read successfully, uploading to ImgBB...');
    
    // Make the API request with POST and FormData
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    // Parse the response
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`ImgBB API error (${response.status}): ${errorMsg}`);
    }
    
    const data = await response.json();
    
    // Log full response for debugging
    console.log('ImgBB response:', JSON.stringify(data, null, 2));
    
    // Check success and extract URL
    if (data.success && data.data) {
      // Prefer display_url for rendered images
      if (data.data.display_url) {
        console.log(`Image uploaded successfully: ${data.data.display_url}`);
        return data.data.display_url;
      }
      
      // Fall back to direct URL
      if (data.data.url) {
        console.log(`Image uploaded successfully: ${data.data.url}`);
        return data.data.url;
      }
      
      throw new Error('No usable URL in ImgBB response');
    } else {
      console.error('Unexpected ImgBB response:', data);
      throw new Error('Unexpected ImgBB response structure');
    }
  } catch (error) {
    console.error('Error uploading to ImgBB:', error);
    // Return fallback image URL on any error
    return FALLBACK_IMAGE_URL;
  }
} 