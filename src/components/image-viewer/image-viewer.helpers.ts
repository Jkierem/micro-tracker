import { Option, pipe } from "effect";
import { ImageLoader } from "../../services/image-loader.service";
import { ImageState } from "./image-viewer.types";

export const renderTiff = (
    canvasRef: React.RefObject<HTMLCanvasElement>,
    image: ImageLoader.Slice
) => {
    const { ifd: { width, height }, data } = image;
    pipe(
        Option.fromNullable(canvasRef.current),
        Option.flatMap(canvas => {
            canvas.width = width;
            canvas.height = height;
            return Option.fromNullable(canvas.getContext("2d"))
        }),
        Option.map(ctx => {
            const canvasImage = ctx.createImageData(width, height);
            canvasImage.data.set(data);
            ctx.putImageData(canvasImage, 0, 0);
        })
    )
}

export const resetImageState = (state: Option.Option<ImageState>) => pipe(
    state,
    Option.flatMap(({ resourceUrl }) => {
        URL.revokeObjectURL(resourceUrl);
        return Option.none();
    })
);