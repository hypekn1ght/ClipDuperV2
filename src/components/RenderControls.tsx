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

  // Combine text and videoSrc for the actual inputProps to Remotion
  const actualInputProps: z.infer<typeof CompositionProps> = React.useMemo(() => ({
    ...currentInputPropsFromPage,
    title: text, // Ensure title is updated from the text state
    videoSrc,
  }), [currentInputPropsFromPage, text, videoSrc]);


  const { renderMedia: originalRenderMedia, state, undo } = useRendering(COMP_NAME, actualInputProps);
  const [isReadyToRenderAfterUpload, setIsReadyToRenderAfterUpload] = React.useState(false);

  const handleRenderWithUpload = async () => {
    console.log('[RenderControls] handleRenderWithUpload called. Video file:', videoFile);
    if (videoFile) {
      const formData = new FormData();
      formData.append('video', videoFile);

      try {
        // Show some indication of upload
        // This is a simplified state update; you might want a more robust state for 'uploading'
        // For now, we rely on the 'invoking' state of useRendering for general loading indication.
        console.log('[RenderControls] Attempting to fetch /api/upload with FormData.');
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json(); // Call .json() only ONCE
        console.log('[RenderControls] Received response from /api/upload:', result);

        if (!response.ok) {
          // If response was not ok, 'result' now holds the error payload from the server
          // The server sends { error: '...', message: '...' } for errors.
          throw new Error(result.message || result.error || 'Upload failed');
        }

        // If response.ok, 'result' holds the success payload.
        // Currently, it's { message: '...', fileDetails: {...} }
        // We expect it to eventually contain result.videoUrl
        if (result.videoUrl) {
          setVideoSrc(result.videoUrl);
          setIsReadyToRenderAfterUpload(true); // Trigger effect to render
          return; // Upload successful, rendering will be handled by useEffect
        } else {
          // For now, since S3 upload isn't implemented, videoUrl won't be there.
          // We can consider the parsing successful if we reach here and response was ok.
          console.log('File parsed on server, but no S3 videoUrl yet:', result.fileDetails);
          // If you want to proceed to render with a local blob URL for testing *before* S3 is ready,
          // you could do that here, but the main goal is to get the S3 URL.
          // For now, let's assume we need videoUrl to proceed to Remotion rendering.
          // throw new Error('Upload successful, but no video URL returned from the server.');
          // TEMPORARY: To acknowledge successful parsing without S3, let's not throw an error here yet.
          // We will handle the actual rendering trigger once S3 URL is available.
          alert(`File parsed by server: ${result.message}. S3 upload next.`);
          return; // Stop here for now, as no S3 URL to render with.
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Update state to show an error message to the user
        // This part needs to integrate with the `state` from `useRendering` or a new error state.
        alert(`Error uploading video: ${error instanceof Error ? error.message : String(error)}`);
        return;
      }
    } else {
      // If no video file, just proceed with original render logic (e.g., only text)
      originalRenderMedia();
    }
  };

  React.useEffect(() => {
    if (isReadyToRenderAfterUpload && state.status !== 'invoking' && state.status !== 'rendering') {
      originalRenderMedia();
      setIsReadyToRenderAfterUpload(false); // Reset trigger
    }
  }, [isReadyToRenderAfterUpload, originalRenderMedia, state.status]);

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "invoking" ||
      state.status === "error" ? (
        <>
          <Input
            disabled={state.status === "invoking"}
            setText={setText}
            text={text}
          ></Input>
          <Spacing />
          <div>
            <label htmlFor="video-upload" style={{ display: "block", marginBottom: "0.5rem" }}>Upload Video (optional):</label>
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              disabled={state.status === "invoking"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoFile(file);
                  const localUrl = URL.createObjectURL(file);
                  setVideoSrc(localUrl); // Set for internal use by RenderControls for eventual S3 upload
                  onLocalVideoSelectedForPlayer(file); // Pass File object to parent for local player
                } else {
                  setVideoFile(null);
                  setVideoSrc(undefined);
                  onLocalVideoSelectedForPlayer(null); // Notify parent that file was cleared
                }
              }}
              style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          </div>
          <Spacing></Spacing>
          <AlignEnd>
            <Button
              disabled={state.status === "invoking"}
              loading={state.status === "invoking"}
              onClick={handleRenderWithUpload}
            >
              Render video
            </Button>
          </AlignEnd>
          {state.status === "error" ? (
            <ErrorComp message={state.error.message}></ErrorComp>
          ) : null}
        </>
      ) : null}
      {state.status === "rendering" || state.status === "done" ? (
        <>
          <ProgressBar
            progress={state.status === "rendering" ? state.progress : 1}
          />
          <Spacing></Spacing>
          <AlignEnd>
            <DownloadButton undo={undo} state={state}></DownloadButton>
          </AlignEnd>
        </>
      ) : null}
    </InputContainer>
  );
};
