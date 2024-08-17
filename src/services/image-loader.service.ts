import { Context, Data, Effect, Layer, Option, pipe } from "effect";
import React, { useRef, useState } from "react";
import { ImageRepo } from "../adapters/image.repository";
import { ProcessingError, TIFFAdapter } from "../adapters/tiff.adapter";
import { BitmapAdapter, CanvasContextError, RenderError } from "../adapters/bitmap.adapter";

export class NullCanvasError
extends Data.TaggedError("NullCanvasError") {}

export declare namespace ImageLoader {
    type CanvasError = NullCanvasError | CanvasContextError;
    type CanvasRef = React.RefObject<HTMLCanvasElement>;
    
    type LoadError = CanvasError | ProcessingError | RenderError;
    type ClearError = CanvasError;
    type UpdateError = CanvasError | RenderError;

    type ImageState = Option.Option<{
        fileType: ImageRepo.Image['fileType'],
        raw: ArrayBuffer,
        current: number,
        slices: Uint8Array[]
    }>
    
    type ImageController = {
        load: (image: ImageRepo.Image) => Effect.Effect<void,  LoadError>,
        clear: () => Effect.Effect<void, ClearError>;
        update: (fn: (prev: ImageState) => ImageState) => Effect.Effect<void, UpdateError>;
    }

    type Shape = {
        useImageLoader: () => [CanvasRef, ImageState, ImageController];
    }
}
export class ImageLoader
extends Context.Tag("@service/image-loader")<
    ImageLoader,
    ImageLoader.Shape
>(){
    static Live = Layer.effect(ImageLoader, Effect.gen(function*(_){
        const tiff = yield* TIFFAdapter;
        const Bitmap = yield* BitmapAdapter; 

        return ImageLoader.of({
            useImageLoader() {
                const [current, setCurrent] = useState<ImageLoader.ImageState>(Option.none());
                const canvasRef = useRef<HTMLCanvasElement>(null);

                const Canvas = Effect.suspend(() => pipe(
                    Option.fromNullable(canvasRef.current),
                    Effect.mapError(() => new NullCanvasError())
                ))

                const CanvasContex = pipe(
                    Canvas,
                    Effect.bindTo("canvas"),
                    Effect.bind("ctx", ({ canvas }) => Option.fromNullable(canvas.getContext("2d"))),
                    Effect.mapError(() => new CanvasContextError()),
                    Effect.map(({ canvas, ctx }) => [canvas, ctx] as const)
                )

                const controller: ImageLoader.ImageController = {
                    load(image) {
                        return this.clear().pipe(
                            Effect.flatMap(() => {
                                return Effect.gen(function*(_){
                                    let slices = []
                                    if( image.fileType === "image/tiff" ){
                                        const ifds = yield* tiff.decode(image.data.buffer);
                                        slices = yield* Effect.all(ifds.map(ifd => {
                                            return pipe(
                                                tiff.decodeImage(image.data, ifd),
                                                Effect.zipRight(tiff.toRGBA8(ifd))
                                            )
                                        }))
                                    } else {
                                        slices = [image.data];
                                    }
                                    const canvas = yield* Canvas;
                                    yield* Bitmap.draw(slices[0], canvas);
                                    setCurrent(Option.some({
                                        slices,
                                        current: 0,
                                        fileType: image.fileType,
                                        raw: image.data.buffer,
                                    }))
                                })
                            }),
                        )
                    },
                    clear() {
                        return Effect.gen(function* (_){
                            const [canvas, ctx] = yield* CanvasContex

                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            setCurrent(Option.none());
                        })
                    },
                    update(fn) {
                        return pipe(
                            Effect.sync(() => fn(current)),
                            Effect.tap((next) => setCurrent(next)),
                            Effect.flatMap((stateM) => {
                                return Effect.gen(function*(_){
                                    const state = yield* stateM;
                                    const slice = state.slices[state.current];
                                    const canvas = yield* Canvas;
                                    return yield* Bitmap.draw(slice, canvas);
                                })
                            }),
                            Effect.catchTag("NoSuchElementException", () => Effect.void)
                        )
                    },
                }
                
                return [canvasRef, current, controller];
            }
        })
    }))
}