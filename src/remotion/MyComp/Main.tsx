import { z } from "zod";
import {
  AbsoluteFill,
  Sequence,
  // spring,
  // useCurrentFrame,
  // useVideoConfig,
  OffthreadVideo,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import React from "react";
import { CompositionProps } from "../../../types/constants";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "700"],
});

const container: React.CSSProperties = {
  backgroundColor: "white",
};

// const logo: React.CSSProperties = {
//   justifyContent: "center",
//   alignItems: "center",
// };

// Style for the video container to apply rotation
const videoContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex", // Using flex to center the video if its dimensions are smaller than the container
  justifyContent: "center",
  alignItems: "center",
};

export const Main = ({ videoSrc, rotation = 5, scale = 0.95 }: z.infer<typeof CompositionProps>) => {
  // const frame = useCurrentFrame();
  // const { fps } = useVideoConfig();

  // const transitionStart = 2 * fps;
  // const transitionDuration = 1 * fps;

  // const logoOut = spring({
  //   fps,
  //   frame,
  //   config: {
  //     damping: 200,
  //   },
  //   durationInFrames: transitionDuration,
  //   delay: transitionStart,
  // });

  // const titleStyle: React.CSSProperties = useMemo(() => {
  //   return { fontFamily, fontSize: 70 };
  // }, []);

  return (
      
      videoSrc && (
        <Sequence>
          <AbsoluteFill style={videoContainerStyle}>
            <OffthreadVideo
              src={videoSrc}
              style={{
                transform: `rotate(${rotation}deg) scale(${scale})`,
                maxWidth: "100%",
                maxHeight: "100%",
                filter: 'saturate(1.05)',
              }}
              playbackRate={0.95}
            />
          </AbsoluteFill>
        </Sequence>
      )
  );
};
