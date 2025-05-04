import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const IMAGE_PATH = path.join(__dirname, 'output.png');

/**
 * Uploads the generated image to an S3 bucket
 * Returns the public URL of the uploaded image
 */
export async function uploadImageToS3(): Promise<string> {
  if (!S3_BUCKET) {
    throw new Error('S3_BUCKET_NAME environment variable is required');
  }

  // Check if the image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Image file not found at ${IMAGE_PATH}`);
  }

  try {
    // Configure S3 client
    const s3Client = new S3Client({ 
      region: AWS_REGION,
      // AWS credentials are automatically loaded from environment variables:
      // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    });

    // Generate a filename with date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `daily-tokens-${dateStr}.png`;

    // Read the image file
    const fileContent = fs.readFileSync(IMAGE_PATH);

    // Upload params
    const params = {
      Bucket: S3_BUCKET,
      Key: filename,
      Body: fileContent,
      ContentType: 'image/png',
      ACL: 'public-read' as const, // Type assertion to match expected enum
    };

    // Upload the file
    await s3Client.send(new PutObjectCommand(params));

    // Construct and return the public URL
    const publicUrl = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${filename}`;
    console.log(`Image uploaded successfully to ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
} 