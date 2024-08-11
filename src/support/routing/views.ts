import { Data } from "effect";

export type View = Data.TaggedEnum<{
    Login: {},
    ImageViewer: {},
    MainMenu: {},
    Gallery: {},
    Archive: {},
}>

const { Login, ImageViewer, MainMenu, Gallery, Archive } = Data.taggedEnum<View>();
export const Views = { Login, ImageViewer, MainMenu, Gallery, Archive };