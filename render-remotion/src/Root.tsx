import React from "react";
import { Composition } from "remotion";
import { FlowMoviePipelinePop } from "./videos/flow-movie-pipeline-pop";
import { TOTAL_FRAMES_V6 } from "./videos/flow-movie-pipeline-pop-data";
import { FootageDemo, FOOTAGE_DEMO_FRAMES } from "./videos/footage-demo";
import { FlowMoviePipelineTour } from "./videos/flow-movie-pipeline-tour";
import { TOTAL_FRAMES as FMP_FRAMES } from "./videos/flow-movie-pipeline-tour-data";
import { SkinGallery, SKIN_COUNT } from "./videos/skin-gallery";
import { FlowMoviePipelineRepoDark } from "./videos/flow-movie-pipeline-repodark";
import { CavemanPonytail } from "./videos/caveman-ponytail";
import { TOTAL_FRAMES as CP_FRAMES } from "./videos/caveman-ponytail-data";
import { FbAds2026 } from "./videos/fb-ads-2026";
import { TOTAL_FRAMES as FBA_FRAMES } from "./videos/fb-ads-2026-data";
import { ChanktbAny2Video } from "./videos/chanktb-any2video";
import { TOTAL_FRAMES as A2V_FRAMES } from "./videos/chanktb-any2video-data";

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
        id="fb-ads-2026"
        component={FbAds2026}
        durationInFrames={FBA_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="caveman-ponytail"
        component={CavemanPonytail}
        durationInFrames={CP_FRAMES}
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
        id="chanktb-any2video"
        component={ChanktbAny2Video}
        durationInFrames={A2V_FRAMES}
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
