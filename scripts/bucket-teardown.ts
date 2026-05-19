import { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } from '@aws-sdk/client-s3';
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
  console.log(`Starting S3/R2 storage teardown for bucket "${bucketName}"...`);

  // 1. Delete all objects in the bucket (required before deleting the bucket itself)
  try {
    let truncated = true;
    let continuationToken: string | undefined = undefined;

    while (truncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

      const listResponse = await s3.send(listCommand);
      const objects = listResponse.Contents || [];

      if (objects.length > 0) {
        console.log(`Found ${objects.length} objects. Deleting...`);
        const deleteParams = {
          Bucket: bucketName,
          Delete: {
            Objects: objects.map((obj) => ({ Key: obj.Key })),
            Quiet: true,
          },
        };
        await s3.send(new DeleteObjectsCommand(deleteParams));
        console.log(`Deleted batch of ${objects.length} objects.`);
      }

      truncated = listResponse.IsTruncated || false;
      continuationToken = listResponse.NextContinuationToken;
    }
    console.log('All objects deleted successfully.');
  } catch (error: any) {
    // If the bucket doesn't exist, we don't need to delete anything
    if (error.name === 'NoSuchBucket' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket "${bucketName}" does not exist. No teardown needed.`);
      process.exit(0);
    } else {
      console.error('Error listing/deleting objects in bucket:', error);
      process.exit(1);
    }
  }

  // 2. Delete the bucket itself
  try {
    console.log(`Deleting bucket "${bucketName}"...`);
    await s3.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" deleted successfully.`);
  } catch (error) {
    console.error('Error deleting bucket:', error);
    process.exit(1);
  }

  console.log('Bucket teardown completed successfully!');
}

run().catch((err) => {
  console.error('Unexpected error running bucket teardown:', err);
  process.exit(1);
});
