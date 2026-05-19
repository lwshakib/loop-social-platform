import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const bucketName = process.env.AWS_S3_BUCKET_NAME;

if (!bucketName) {
  console.error('Error: AWS_S3_BUCKET_NAME is not defined in the environment variables.');
  process.exit(1);
}

// Initialize the AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function run() {
  console.log(`Starting S3/R2 storage setup for bucket "${bucketName}"...`);

  // 1. Check if the bucket exists, and create it if it doesn't
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" already exists.`);
  } catch (error: any) {
    // A 404 HttpStatusCode or NotFound error indicates the bucket doesn't exist yet
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket "${bucketName}" does not exist. Creating bucket...`);
      try {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket "${bucketName}" created successfully.`);
      } catch (createErr) {
        console.error('Failed to create bucket:', createErr);
        process.exit(1);
      }
    } else {
      console.error('Error checking bucket existence:', error);
      process.exit(1);
    }
  }

  // 2. Put CORS configuration on the bucket
  try {
    console.log(`Applying CORS configuration to bucket "${bucketName}" (Origins: "*")...`);
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      })
    );
    console.log('CORS configuration applied successfully.');
  } catch (corsErr) {
    console.error('Failed to apply CORS configuration:', corsErr);
    process.exit(1);
  }

  console.log('Bucket setup completed successfully!');
}

run().catch((err) => {
  console.error('Unexpected error running bucket setup:', err);
  process.exit(1);
});
