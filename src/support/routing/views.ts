import { Data } from "effect";
import { ImageLoader } from "../../services/image-loader.service";

export type View = Data.TaggedEnum<{
    Login: {},
    Main: {},
    Capture: {},
    Camera: {},
    Visualizer: { readonly file: ImageLoader.FileContainer },
    Gallery: {},
    Reports: {},
    Report: {},
}>

const { Login, Main, Camera, Capture, Visualizer, Gallery, Reports, Report, $is } = Data.taggedEnum<View>();
export const Views = { Login, Camera, Main, Capture, Visualizer, Gallery, Reports, Report };
export const isView = <V extends View>(view: V) => $is(view._tag);