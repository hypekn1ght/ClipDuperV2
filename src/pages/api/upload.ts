import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files, File as FormidableFile } from 'formidable';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import fs from 'fs';

interface UploadResponse {
  message?: string;
  error?: string;
  videoUrl?: string; // Added for S3 URL
  fileDetails?: any; // To send back some info about the parsed file for testing
}

// Disable Next.js body parser for this route so formidable can handle the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method === 'POST') {
    const form = new IncomingForm();

    form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Error processing file upload.', message: err.message });
      }

      // 'files' will contain the uploaded files.
      // If your input field name is 'video' (as in RenderControls.tsx), it will be files.video
      const uploadedFile = files.video?.[0] as FormidableFile | undefined;

      if (uploadedFile) {
        console.log('File parsed successfully:');
        console.log('Original Filename:', uploadedFile.originalFilename);
        console.log('Temporary Path:', uploadedFile.filepath);
        console.log('MIME Type:', uploadedFile.mimetype);
        console.log('Size:', uploadedFile.size);

        // S3 Upload Logic
        const s3Client = new S3Client({
          region: process.env.AWS_S3_UPLOAD_REGION,
          credentials: {
            accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY!,
          },
        });

        const fileStream = fs.createReadStream(uploadedFile.filepath);
        const bucketName = process.env.AWS_S3_UPLOAD_BUCKET_NAME;
        // Use original filename for S3 key. Consider sanitizing or making unique in production.
        const s3Key = uploadedFile.originalFilename || `upload-${Date.now()}`;

        const putObjectParams: {
          Bucket: string | undefined;
          Key: string;
          Body: fs.ReadStream;
          ContentType: string;
          ACL?: ObjectCannedACL; // Explicitly type ACL property
        } = {
          Bucket: bucketName,
          Key: s3Key,
          Body: fileStream,
          ContentType: uploadedFile.mimetype || 'application/octet-stream',
          ACL: 'public-read', // This makes the uploaded video publicly readable
        };

        try {
          await s3Client.send(new PutObjectCommand(putObjectParams));
          const s3Url = `https://${bucketName}.s3.${process.env.AWS_S3_UPLOAD_REGION}.amazonaws.com/${s3Key}`;
          
          console.log('Successfully uploaded to S3 with public-read ACL:', s3Url);
          res.status(200).json({
            message: 'File uploaded to S3 successfully with public-read ACL.',
            videoUrl: s3Url,
            fileDetails: {
              originalFilename: uploadedFile.originalFilename,
              mimetype: uploadedFile.mimetype,
              size: uploadedFile.size,
              s3Key: s3Key,
            },
          });
        } catch (s3Error: any) {
          console.error('Error uploading to S3:', s3Error);
          res.status(500).json({ error: 'Failed to upload file to S3.', message: s3Error.message });
        }
      } else {
        console.log('No file found in the upload.');
        res.status(400).json({ error: 'No file uploaded or field name is incorrect.' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

