import { z } from "zod";
import { useRendering } from "../helpers/use-rendering";
import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button/Button";
import { InputContainer } from "./Container";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { COMP_NAME, CompositionProps, defaultMyCompProps } from "../../types/constants";
import React from "react"; // Add React import for useState

export const RenderControls: React.FC<{
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  inputProps: z.infer<typeof CompositionProps>;
  onLocalVideoSelectedForPlayer: (file: File | null) => void; // New prop
}> = ({ text, setText, inputProps: currentInputPropsFromPage, onLocalVideoSelectedForPlayer }) => {
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoSrc, setVideoSrc] = React.useState<string | undefined>(
    defaultMyCompProps.videoSrc,
  );
  const [s3KeyForDeletion, setS3KeyForDeletion] = React.useState<string | undefined>(undefined);
  const [s3BucketForDeletion, setS3BucketForDeletion] = React.useState<string | undefined>(undefined);

  // Combine text and videoSrc for the actual inputProps to Remotion
  const actualInputProps: z.infer<typeof CompositionProps> = React.useMemo(() => ({
    ...currentInputPropsFromPage,
    title: text, // Ensure title is updated from the text state
    videoSrc,
    s3Key: s3KeyForDeletion,
    s3Bucket: s3BucketForDeletion,
  }), [currentInputPropsFromPage, text, videoSrc, s3KeyForDeletion, s3BucketForDeletion]);


  const { renderMedia: originalRenderMedia, state, undo } = useRendering(COMP_NAME, actualInputProps);
  const [isReadyToRenderAfterUpload, setIsReadyToRenderAfterUpload] = React.useState(false);
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'error' | 'success'>('idle');
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleRenderWithUpload = async () => {
    if (!videoFile) {
      // If no video file is selected, just proceed with the original render logic.
      originalRenderMedia();
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      // 1. Get pre-signed URL from our API
      const presignedUrlResponse = await fetch('/api/s3/get-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: videoFile.name,
          fileType: videoFile.type,
          videoWidth: currentInputPropsFromPage.width,
          videoHeight: currentInputPropsFromPage.height,
        }),
      });

      const { uploadUrl, finalUrl, key, bucketName, error: presignedError, message: presignedMessage } = await presignedUrlResponse.json();

      if (!presignedUrlResponse.ok) {
        throw new Error(presignedMessage || presignedError || 'Failed to get pre-signed URL.');
      }

      // 2. Upload the file directly to S3 using the pre-signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: videoFile,
        headers: { 'Content-Type': videoFile.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 Upload failed. Check browser console for details.');
      }

      setUploadStatus('success');

      // 3. Set the final S3 URL, store key/bucket for deletion, and trigger Remotion render
      setVideoSrc(finalUrl);
      setS3KeyForDeletion(key);
      setS3BucketForDeletion(bucketName);
      setIsReadyToRenderAfterUpload(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadError(message);
      setUploadStatus('error');
    }
  };

  React.useEffect(() => {
    if (isReadyToRenderAfterUpload && state.status !== 'invoking' && state.status !== 'rendering') {
      originalRenderMedia();
      setIsReadyToRenderAfterUpload(false); // Reset trigger
      setUploadStatus('idle'); // Reset upload status for next time
    }
  }, [isReadyToRenderAfterUpload, originalRenderMedia, state.status]);

  return (
    <>
      <InputContainer>
        <Input
          setText={setText}
          text={text}
          placeholder="Enter title here"
        ></Input>
      </InputContainer>
      <Spacing />
      <InputContainer>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setVideoFile(file || null);
            onLocalVideoSelectedForPlayer(file || null);
          }}
        />
      </InputContainer>
      <Spacing />
      <AlignEnd>
        <Button
          disabled={state.status === 'invoking' || uploadStatus === 'uploading'}
          loading={state.status === 'invoking' || uploadStatus === 'uploading'}
          onClick={handleRenderWithUpload}
        >
          {uploadStatus === 'uploading' ? 'Uploading...' : 'Render video'}
        </Button>
      </AlignEnd>
      <Spacing />

      {/* Upload-specific error */}
      {uploadStatus === 'error' && (
        <ErrorComp message={uploadError || 'An unknown upload error occurred.'} />
      )}

      {/* Remotion rendering state */}
      {state.status === 'error' && <ErrorComp message={state.error.message} />}
      {state.status === 'rendering' && <ProgressBar progress={state.progress} />}
      {state.status === 'done' && <DownloadButton state={state} undo={undo} />}
    </>
  );
};
