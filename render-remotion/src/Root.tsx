import React from "react";
import { Composition } from "remotion";
import { FlowMoviePipelinePop } from "./videos/flow-movie-pipeline-pop";
import { TOTAL_FRAMES_V6 } from "./videos/flow-movie-pipeline-pop-data";
import { FootageDemo, FOOTAGE_DEMO_FRAMES } from "./videos/footage-demo";
import { FlowMoviePipelineTour } from "./videos/flow-movie-pipeline-tour";
import { TOTAL_FRAMES as FMP_FRAMES } from "./videos/flow-movie-pipeline-tour-data";
import { SkinGallery, SKIN_COUNT } from "./videos/skin-gallery";
import { FlowMoviePipelineRepoDark } from "./videos/flow-movie-pipeline-repodark";

// One run = one file in src/videos/ + one <Composition> registered here.
// id = the run's slug. Default 9:16 1080x1920 30fps.

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="flow-movie-pipeline-tour"
        component={FlowMoviePipelineTour}
        durationInFrames={FMP_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="footage-demo"
        component={FootageDemo}
        durationInFrames={FOOTAGE_DEMO_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="flow-movie-pipeline-pop"
        component={FlowMoviePipelinePop}
        durationInFrames={TOTAL_FRAMES_V6}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="flow-movie-pipeline-repodark"
        component={FlowMoviePipelineRepoDark}
        durationInFrames={FMP_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="skin-gallery"
        component={SkinGallery}
        durationInFrames={SKIN_COUNT}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
