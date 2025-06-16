import { Player } from "@remotion/player";
import type { NextPage } from "next";
import Head from "next/head";
import React, { useMemo, useState } from "react";
import { Main } from "../remotion/MyComp/Main";
import {
  CompositionProps,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { z } from "zod";
import { RenderControls } from "../components/RenderControls";
import { Tips } from "../components/Tips/Tips";
import { Spacing } from "../components/Spacing";

const container: React.CSSProperties = {
  maxWidth: 768,
  margin: "auto",
  marginBottom: 20,
};

const outer: React.CSSProperties = {
  borderRadius: "var(--geist-border-radius)",
  overflow: "hidden",
  boxShadow: "0 0 200px rgba(0, 0, 0, 0.15)",
  marginBottom: 40,
  marginTop: 60,
};

const player: React.CSSProperties = {
  width: "100%",
};

const Home: NextPage = () => {
  const [title, setTitle] = useState<string>(defaultMyCompProps.title);
  const [localPlayerVideoUrl, setLocalPlayerVideoUrl] = useState<string | null>(null);
  const [videoPlayerWidth, setVideoPlayerWidth] = useState<number>(VIDEO_WIDTH);
  const [videoPlayerHeight, setVideoPlayerHeight] = useState<number>(VIDEO_HEIGHT);
  const [videoPlayerDurationInFrames, setVideoPlayerDurationInFrames] = useState<number>(DURATION_IN_FRAMES);
  const [videoPlayerFps, setVideoPlayerFps] = useState<number>(VIDEO_FPS);

  const inputProps: z.infer<typeof CompositionProps> = useMemo(() => {
    // Start with all defaults, then override specific ones for the player or from state
    return {
      ...defaultMyCompProps,
      title: title,
      videoSrc: localPlayerVideoUrl ?? defaultMyCompProps.videoSrc,
      width: videoPlayerWidth,
      height: videoPlayerHeight,
      durationInFrames: videoPlayerDurationInFrames,
      fps: videoPlayerFps,
    };
  }, [title, localPlayerVideoUrl]);

  const handleLocalVideoSelectedForPlayer = (file: File | null) => {
    if (localPlayerVideoUrl) {
      URL.revokeObjectURL(localPlayerVideoUrl);
    }

    if (file) {
      const newUrl = URL.createObjectURL(file);
      setLocalPlayerVideoUrl(newUrl);

      // Get video dimensions
      const videoElement = document.createElement('video');
      videoElement.src = newUrl;
      videoElement.onloadedmetadata = () => {
        console.log('[index.tsx] onloadedmetadata: Video metadata loaded.');
        console.log('[index.tsx] Original video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
        console.log('[index.tsx] Original video duration (seconds):', videoElement.duration);
        console.log('[index.tsx] Using default VIDEO_FPS for calculations:', VIDEO_FPS);
        setVideoPlayerWidth(videoElement.videoWidth);
        setVideoPlayerHeight(videoElement.videoHeight);
        // For FPS, we'll use the default VIDEO_FPS for now as browser doesn't easily provide it.
        // Duration in frames will be video duration in seconds * target FPS.
        const durationInSeconds = videoElement.duration;
        if (isFinite(durationInSeconds)) {
          setVideoPlayerDurationInFrames(Math.round(durationInSeconds * VIDEO_FPS)); 
        } else {
          // Fallback if duration is not finite (e.g. live stream, though not expected here)
          setVideoPlayerDurationInFrames(DURATION_IN_FRAMES); 
        }
        setVideoPlayerFps(VIDEO_FPS); // Using default FPS
        console.log('[index.tsx] State updated to: width=', videoElement.videoWidth, 'height=', videoElement.videoHeight, 'durationInFrames=', Math.round(videoElement.duration * VIDEO_FPS));
        // No need to revoke newUrl here as it's used by the player
      };
      videoElement.onerror = (error) => {
        console.error("[index.tsx] onerror: Error loading video metadata:", error);
        // Also log the videoElement.error if available
        if (videoElement.error) {
          console.error("[index.tsx] videoElement.error details:", videoElement.error);
        }
        console.error("Error loading video metadata");
        // Reset to default dimensions or handle error appropriately
        setVideoPlayerWidth(VIDEO_WIDTH);
        setVideoPlayerHeight(VIDEO_HEIGHT);
        setVideoPlayerDurationInFrames(DURATION_IN_FRAMES); // Reset duration
        setVideoPlayerFps(VIDEO_FPS); // Reset FPS
        setLocalPlayerVideoUrl(null); // Clear the video src if metadata fails
        URL.revokeObjectURL(newUrl); // Revoke if there was an error
      };
    } else {
      setLocalPlayerVideoUrl(null);
      setVideoPlayerWidth(VIDEO_WIDTH); // Reset to default if file is cleared
      setVideoPlayerHeight(VIDEO_HEIGHT);
      setVideoPlayerDurationInFrames(DURATION_IN_FRAMES); // Reset duration
      setVideoPlayerFps(VIDEO_FPS); // Reset FPS
    }
  };

  return (
    <div>
      <Head>
        <title>Remotion and Next.js</title>
        <meta name="description" content="Remotion and Next.js" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={container}>
        <div className="cinematics" style={outer}>
          <Player
            component={Main}
            inputProps={inputProps}
            durationInFrames={videoPlayerDurationInFrames}
            fps={videoPlayerFps}
            compositionHeight={videoPlayerHeight}
            compositionWidth={videoPlayerWidth}
            style={player}
            controls
            autoPlay
            loop
          />
        </div> {/* Closes div.cinematics */}
        <RenderControls
          // Pass title and setTitle to RenderControls if it needs to modify the title
          // If RenderControls only reads title from inputProps, these specific props might not be needed here
          // For now, assuming RenderControls might have an input field for the title: 
          text={title} // Assuming RenderControls uses 'text' internally for its input field
          setText={setTitle} // Assuming RenderControls uses 'setText' internally
          inputProps={inputProps}
          onLocalVideoSelectedForPlayer={(file) => handleLocalVideoSelectedForPlayer(file as File | null)} // Pass the callback, ensure type compatibility
        />
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Tips></Tips>
      </div> {/* Closes div style={container} */}
    </div>
  );
};

export default Home;
