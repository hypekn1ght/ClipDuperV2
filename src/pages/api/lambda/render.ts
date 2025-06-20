import { AwsRegion, RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, TIMEOUT } from "../../../../config.mjs";
import { executeApi } from "../../../helpers/api-response";
import { RenderRequest } from "../../../../types/schema";
// // import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";


// Ensure necessary S3 env vars are present for deletion capability
if (!process.env.AWS_S3_UPLOAD_REGION) {
  console.warn("[render.ts] AWS_S3_UPLOAD_REGION environment variable is not set for the render lambda. S3 deletion might fail if the region is required and not correctly inferred. Will attempt to use Lambda's region as fallback.");
}

// const s3Client = new S3Client({
//   // Prefer AWS_S3_UPLOAD_REGION for the bucket operations, fallback to REGION (Lambda's execution region)
//   region: process.env.AWS_S3_UPLOAD_REGION || (REGION as AwsRegion),
//   credentials: {
//     // These credentials are also used by Remotion Lambda and checked earlier in the code
//     accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

const render = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    if (req.method !== "POST") {
      throw new Error("Only POST requests are allowed");
    }

    if (
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.REMOTION_AWS_ACCESS_KEY_ID
    ) {
      throw new TypeError(
        "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
      );
    }
    if (
      !process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
    ) {
      throw new TypeError(
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
      );
    }

    // The body.inputProps (derived from CompositionProps) now include optional 'width' and 'height'.
    // We assume that if compositionWidth/Height are not direct options for renderMediaOnLambda
    // (as suggested by a previous lint error for this project's @remotion/lambda version/types),
    // Remotion will pick up 'width' and 'height' from the inputProps themselves
    // to override the default composition dimensions during Lambda rendering.
    console.log("[/api/lambda/render] Received inputProps for Lambda:", body.inputProps);

    // Attempting to pass overrides directly, bypassing TS error with 'as any' for testing
    // if the runtime accepts these parameters.
    const { width, height, durationInFrames, fps, ...restInputProps } = body.inputProps;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const renderOptions: any = {
      codec: "h264",
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION as AwsRegion,
      serveUrl: "https://remotionlambda-useast1-9m1089x0yl.s3.us-east-1.amazonaws.com/sites/remotion-render/index.html", // Hardcoded to latest correct deployment (remotion-render)
      composition: body.id,
      inputProps: restInputProps, // Pass other props (like title, videoSrc) as usual
      framesPerLambda: 10, // Or your preferred value
      downloadBehavior: {
        type: "download",
        fileName: "video.mp4",
      },
    };

    console.log('width', width)
    console.log('height', height)
    console.log('durationInFrames', durationInFrames)
    console.log('fps', fps)

    // Conditionally add parameters if they are defined, using correct names for Remotion v4.0.x
    if (width !== undefined) {
      renderOptions.forceWidth = width;
    }
    if (height !== undefined) {
      renderOptions.forceHeight = height;
    }
    // frameRange is [startFrame, endFrame inclusive]. For N frames, it's [0, N-1].
    // Ensure durationInFrames is a positive number before setting frameRange.
    if (durationInFrames !== undefined && durationInFrames > 0) {
      renderOptions.frameRange = [0, durationInFrames - 1];
    }
    // FPS override is not directly supported by renderMediaOnLambda;
    // the composition's default FPS from Root.tsx will be used.
    // if (fps !== undefined) { 
    //   renderOptions.fps = fps; // This was incorrect
    // }

    const result = await renderMediaOnLambda(renderOptions);

    // [DIAGNOSTIC] Temporarily disabled S3 deletion to debug 'NoSuchKey' error.
    // const { s3Bucket, s3Key, videoSrc } = body.inputProps;

    // if (s3Bucket && s3Key) {
    //   console.log(`[render.ts] Attempting to delete s3://${s3Bucket}/${s3Key} after successful render.`);
    //   try {
    //     const deleteParams = {
    //       Bucket: s3Bucket,
    //       Key: s3Key,
    //     };
    //     await s3Client.send(new DeleteObjectCommand(deleteParams));
    //     console.log(`[render.ts] Successfully deleted s3://${s3Bucket}/${s3Key}.`);
    //   } catch (deleteError) {
    //     console.error(`[render.ts] Failed to delete s3://${s3Bucket}/${s3Key}:`, deleteError);
    //   }
    // } else {
    //   if (videoSrc) {
    //     console.log(`[render.ts] s3Bucket or s3Key not explicitly provided. Cannot delete. videoSrc: ${videoSrc}`);
    //   } else {
    //     console.log("[render.ts] s3Bucket, s3Key, or videoSrc not found. Skipping deletion.");
    //   }
    // }

    return result;
  },
);

export default render;
