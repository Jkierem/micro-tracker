import { Effect, Option, Number, pipe } from "effect";
import { ImageLoader } from "../../services/image-loader.service";
import { useState } from "react";
import { Services } from "../services-provider/services.provider";

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
    Option.flatMap(({ url }) => {
        URL.revokeObjectURL(url);
        return Option.none();
    })
);

interface ImageController {
    load: (image: File) => Effect.Effect<void>;
    next: () => Effect.Effect<void>;
    prev: () => Effect.Effect<void>;
    move: (index: number) => Effect.Effect<void>;
}

export type ImageState = {
    tiff: ImageLoader.TIFF,
    currentSlice: number,
    url: string,
}

type HookReturn = [Option.Option<ImageState>, ImageController];

export const useTiff = (canvasRef: React.RefObject<HTMLCanvasElement>): HookReturn => {
    const { tiffLoader } = Services.use()
    const [imageState, setImageState] = useState<Option.Option<ImageState>>(Option.none);

    const changeSlice = (to: number) => {
        return pipe(
            imageState,
            Option.map((data) => {
                return pipe(
                    to,
                    Option.liftPredicate(Number.between({
                        minimum: 0,
                        maximum: data.tiff.slices.length - 1
                    })),
                    Option.map(currentSlice => ({
                        ...data,
                        currentSlice
                    })),
                    Option.getOrElse(() => data)
                )
            }),
            Option.tap(({ currentSlice, tiff }) => {
                return Option.some(renderTiff(canvasRef, tiff.slices[currentSlice]))
            }),
            setImageState,
        )
    } 

    const controller: ImageController = {
        load(image) {
            return pipe(
                Effect.Do,
                Effect.tap(() => setImageState(resetImageState)),
                Effect.let("url", () => URL.createObjectURL(image)),
                Effect.bind("tiff", ({ url }) => tiffLoader.fromURL(url)),
                Effect.let("currentSlice", () => 0),
                Effect.map(Option.some),
                Effect.tap(setImageState),
                Effect.catchAll(e => {
                    return Effect.sync(() => console.error(e))
                }),
            )
        },
    }

    return [imageState, controller]
}