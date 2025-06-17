import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from 'next';

// Basic error handling for environment variables
if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_UPLOAD_REGION) {
  throw new Error("Missing required AWS environment variables for S3 operations.");
}

const s3Client = new S3Client({
  region: process.env.AWS_S3_UPLOAD_REGION,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { s3Bucket, s3Key } = req.body;

    if (!s3Bucket || !s3Key) {
      return res.status(400).json({ error: 's3Bucket and s3Key are required in the request body' });
    }

    console.log(`[delete-object.ts] Received request to delete s3://${s3Bucket}/${s3Key}`);

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
    });

    await s3Client.send(deleteObjectCommand);

    console.log(`[delete-object.ts] Successfully deleted s3://${s3Bucket}/${s3Key}`);
    res.status(200).json({ message: 'File deleted successfully from S3' });

  } catch (error) {
    console.error('[delete-object.ts] Error deleting file from S3:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'Failed to delete file from S3', message });
  }
}
