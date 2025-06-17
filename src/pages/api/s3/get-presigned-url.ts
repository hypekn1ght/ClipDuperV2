import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { NextApiRequest, NextApiResponse } from 'next';

// Basic error handling for environment variables
if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_UPLOAD_REGION || !process.env.AWS_S3_UPLOAD_BUCKET_NAME) {
  throw new Error("Missing required AWS environment variables for S3 upload.");
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
    const { filename, fileType, videoWidth, videoHeight } = req.body;

    if (!filename || !fileType || typeof videoWidth !== 'number' || typeof videoHeight !== 'number') {
      return res.status(400).json({ error: 'filename (string), fileType (string), videoWidth (number), and videoHeight (number) are required' });
    }

    // Log the video resolution
    console.log(`Preparing S3 upload for video: ${filename}, Type: ${fileType}, Resolution: ${videoWidth}x${videoHeight}`);

    const bucketName = process.env.AWS_S3_UPLOAD_BUCKET_NAME!;
    // Sanitize filename or create a unique key for production use
    const s3Key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      ACL: 'public-read', // Makes the uploaded file publicly accessible
    });

    // Generate the pre-signed URL, valid for 5 minutes
    const signedUrl = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 300, // 5 minutes
    });

    // The final public URL of the object after upload
    const finalUrl = `https://${bucketName}.s3.${process.env.AWS_S3_UPLOAD_REGION}.amazonaws.com/${s3Key}`;

    res.status(200).json({
      uploadUrl: signedUrl,
      key: s3Key,
      finalUrl: finalUrl, // The URL to be used by Remotion
      bucketName: bucketName, // Pass bucket name to client for deletion requests
    });

  } catch (error) {
    console.error('Error creating pre-signed URL:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ error: 'Failed to create pre-signed URL', message });
  }
}
