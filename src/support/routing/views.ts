import { Data } from "effect";

export type View = Data.TaggedEnum<{
    Login: {},
    ImageViewer: {},
    Camera: {},
    MainMenu: {},
    Gallery: {},
    Archive: {},
}>

const { Login, ImageViewer, Camera, MainMenu, Gallery, Archive } = Data.taggedEnum<View>();
export const Views = { Login, ImageViewer, Camera, MainMenu, Gallery, Archive };