import { ImageLoader } from "../../services/image-loader.service";

export type ImageState = {
    tiff: ImageLoader.TIFF,
    currentSlice: number,
    resourceUrl: string,
}