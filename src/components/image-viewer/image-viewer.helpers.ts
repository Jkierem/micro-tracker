import { Effect, Option, Number, pipe } from "effect";
import { ImageLoader } from "../../services/image-loader.service";
import { useEffect, useRef, useState } from "react";
import { Services } from "../services-provider/services.provider";
import { ImageRepo } from "../../adapters/image.repository";

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

const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    pipe(
        Option.fromNullable(canvasRef.current),
        Option.bindTo("canvas"),
        Option.bind("ctx", ({ canvas }) => Option.fromNullable(canvas.getContext("2d"))),
        Option.map(({ ctx, canvas }) => {
            ctx.clearRect(0,0,canvas.width, canvas.height);
            canvas.height = 0;
            canvas.width = 0;
        })
    )
}

interface ImageController {
    load: (image: ImageRepo.Image) => Effect.Effect<void>;
    upload: (image: File) => Effect.Effect<void>;
    next: () => Effect.Effect<void>;
    prev: () => Effect.Effect<void>;
    move: (index: number) => Effect.Effect<void>;
    close: () => Effect.Effect<void>;
}

export type ImageState = {
    tiff: ImageLoader.TIFF,
    currentSlice: number,
    url: string,
}

type CanvasRef = React.RefObject<HTMLCanvasElement>

type HookReturn = [CanvasRef, Option.Option<ImageState>, ImageController];

export const useTiff = (): HookReturn => {
    const { tiffLoader } = Services.use()
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imageState, setImageState] = useState<Option.Option<ImageState>>(Option.none);

    useEffect(() => {
        pipe(
            imageState,
            Option.map(({ currentSlice, tiff }) => {
                renderTiff(canvasRef, tiff.slices[currentSlice])
            })
        )
    },[imageState])

    const changeSlice = (next: (prev: number) => number) => {
        return pipe(
            imageState,
            Option.map((data) => {
                return pipe(
                    next(data.currentSlice),
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
        load(image){
            return pipe(
                Effect.Do,
                Effect.tap(() => setImageState(resetImageState)),
                Effect.bind("tiff", () => tiffLoader.fromUint8Array(image.data)),
                Effect.let("currentSlice", () => 0),
                Effect.let("url", () => ""),
                Effect.map(Option.some),
                Effect.tap(a => setImageState(a)),
                Effect.catchAll(e => {
                    return Effect.sync(() => console.error(e))
                }),
            )
        },
        upload(image) {
            return pipe(
                Effect.Do,
                Effect.tap(() => setImageState(resetImageState)),
                Effect.let("url", () => URL.createObjectURL(image)),
                Effect.bind("tiff", ({ url }) => tiffLoader.fromURL(url)),
                Effect.let("currentSlice", () => 0),
                Effect.map(Option.some),
                Effect.tap(a => setImageState(a)),
                Effect.catchAll(e => {
                    return Effect.sync(() => console.error(e))
                }),
            )
        },
        next() {
            return Effect.sync(() => changeSlice(x => x + 1))
        },
        prev() {
            return Effect.sync(() => changeSlice(x => x - 1)) 
        },
        move(index) {
            return Effect.sync(() => changeSlice(() => index))
        },
        close() {
            return Effect
                .sync(() => setImageState(resetImageState))
                .pipe(Effect.tap(() => clearCanvas(canvasRef)))
        },
    }

    return [canvasRef, imageState, controller]
}