import { Context, Data, Effect, Layer, Option } from "effect"
import { DOMAdapter } from "./dom.adapter";
import { ImageRepo } from "./image.repository";
import { CanvasUtilities } from "../support/render/canvas";

export class RenderError
extends Data.TaggedError("RenderError")<{ error: unknown }> {}

export class CanvasContextError
extends Data.TaggedError("CanvasContextError") {}

export declare namespace BitmapAdapter {
    type Shape = {
        prepareSnapshot: (
            data: Uint8Array | ImageData, 
            canvas: HTMLCanvasElement | OffscreenCanvas
        ) => Effect.Effect<ImageRepo.Dimensions, RenderError | CanvasContextError>;
        draw: (
            data: Uint8Array | ImageData, 
            canvas: HTMLCanvasElement
        ) => Effect.Effect<ImageRepo.Dimensions, RenderError | CanvasContextError>;
    }
}
export class BitmapAdapter
extends Context.Tag("BitmapAdapter")<
    BitmapAdapter,
    BitmapAdapter.Shape
>(){
    static Live = Layer.effect(BitmapAdapter, Effect.gen(function*(_){
        const global = yield* DOMAdapter.Global;

        const create = (data: Uint8Array | ImageData) => {
            return Effect.tryPromise({
                try: () => {
                    if( ArrayBuffer.isView(data) ){
                        const blob = new Blob([data]);
                        return global.createImageBitmap(blob)
                    } else {
                        return global.createImageBitmap(data, 0, 0, data.width, data.height);
                    }
                },
                catch(error) {
                    return new RenderError({ error });
                },
            })
        }

        const close = (bitmap: ImageBitmap) => Effect.sync(() => bitmap.close());

        return BitmapAdapter.of({
            prepareSnapshot(data, canvas) {
                const usingBitmap = (bitmap: ImageBitmap) => {
                    return Effect.gen(function*(_){
                        const ctx = yield* Option.fromNullable(canvas.getContext("2d"));

                        CanvasUtilities.paint(canvas, ctx, bitmap);
                        return {
                            width: bitmap.width,
                            height: bitmap.height
                        }
                    }).pipe(Effect.mapError(() => new CanvasContextError()))
                }
                return Effect.acquireUseRelease(
                    create(data),
                    usingBitmap,
                    close
                )
            },
            draw(data, canvas) {
                const usingBitmap = (bitmap: ImageBitmap) => {
                    return Effect.gen(function*(_){
                        const ctx = yield* Option.fromNullable(canvas.getContext("2d"));

                        CanvasUtilities.paintWithAspectRatio(canvas, ctx, bitmap);
                        return {
                            width: bitmap.width,
                            height: bitmap.height
                        }
                    }).pipe(Effect.mapError(() => new CanvasContextError()))
                }
                return Effect.acquireUseRelease(
                    create(data),
                    usingBitmap,
                    close
                )
            },
        })
    }))
}