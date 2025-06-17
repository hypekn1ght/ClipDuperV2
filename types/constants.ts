import { z } from "zod";
export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
  videoSrc: z.string().optional(), // Making it optional for now
  rotation: z.number().optional(),
  scale: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  durationInFrames: z.number().optional(),
  fps: z.number().optional(),
  s3Bucket: z.string().optional(),
  s3Key: z.string().optional(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Welcome to Remotion with Next.js!",
  videoSrc: undefined, // This will be the S3 URL of the raw uploaded video
  rotation: 5,       // Default rotation
  scale: 0.95,       // Default scale
};

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;
