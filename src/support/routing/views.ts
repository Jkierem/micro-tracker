import { Data } from "effect";
import { FileContainer } from "../../services/image-loader.service";
import { ImageRepo } from "../../adapters/image.repository";
import { JobRepo } from "../../adapters/job.repository";

export type VisualizerData = Data.TaggedEnum<{
    File: { file: FileContainer },
    Image: { image: ImageRepo.Image }
}>

const { File, Image } = Data.taggedEnum<VisualizerData>();
export const VisualizerDataTypes = { File, Image }

export type View = Data.TaggedEnum<{
    Main: {},
    Capture: {},
    Camera: {},
    Visualizer: { data: VisualizerData },
    Gallery: {},
    Reports: {},
    Report: { data: JobRepo.JobId },
}>

const { Main, Camera, Capture, Visualizer, Gallery, Reports, Report, $is } = Data.taggedEnum<View>();
export const Views = { Camera, Main, Capture, Visualizer, Gallery, Reports, Report };
export const isView = <V extends View>(view: V) => $is(view._tag);