import { Data } from "effect";

export type View = Data.TaggedEnum<{
    ImageViewer: {},
    MainMenu: {},
    Gallery: {},
    Archive: {},
}>

const { ImageViewer, MainMenu, Gallery, Archive } = Data.taggedEnum<View>();
export const Views = { ImageViewer, MainMenu, Gallery, Archive };