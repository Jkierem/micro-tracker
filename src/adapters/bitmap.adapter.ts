import { Context, Data, Effect, Layer, Option } from "effect"
import { DOMAdapter } from "./dom.adapter";

export class RenderError
extends Data.TaggedError("RenderError")<{ error: unknown }> {}

export class CanvasContextError
extends Data.TaggedError("CanvasContextError") {}

export declare namespace BitmapAdapter {
    type Shape = {
        draw: (
            data: Uint8Array, 
            canvas: HTMLCanvasElement
        ) => Effect.Effect<void, RenderError | CanvasContextError>;
    }
}
export class BitmapAdapter
extends Context.Tag("BitmapAdapter")<
    BitmapAdapter,
    BitmapAdapter.Shape
>(){
    static Live = Layer.effect(BitmapAdapter, Effect.gen(function*(_){
        const global = yield* _(DOMAdapter, Effect.flatMap(dom => dom.window));

        const create = (data: Uint8Array) => {
            const blob = new Blob([data]);
            return Effect.tryPromise({
                try: () => global.createImageBitmap(blob),
                catch(error) {
                    return new RenderError({ error });
                },
            })
        }

        const close = (bitmap: ImageBitmap) => Effect.sync(() => bitmap.close());

        return BitmapAdapter.of({
            draw(data, canvas) {
                const usingBitmap = (bitmap: ImageBitmap) => {
                    return Effect.gen(function*(_){
                        const ctx = yield* Option.fromNullable(canvas.getContext("2d"));
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                        ctx.drawImage(bitmap, 0, 0);
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