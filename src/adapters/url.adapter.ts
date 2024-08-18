import { Context, Effect, Layer } from "effect";
import { DOMAdapter } from "./dom.adapter";

export declare namespace UrlAdapter {
    type Shape = {
        usingFile: <A, E>(
            file: File, 
            process: (url: string) => Effect.Effect<A, E>
        ) => Effect.Effect<A, E>; 
    }
}

export class UrlAdapter
extends Context.Tag("UrlAdapter")<
    UrlAdapter,
    UrlAdapter.Shape
>(){
    static Live = Layer.effect(UrlAdapter, Effect.gen(function*(_){
        const global = yield* _(
            DOMAdapter,
            Effect.flatMap(dom => dom.window)
        );

        const acquire = (file: File) => Effect.sync(() => global.URL.createObjectURL(file));

        const release = (url: string) => Effect.sync(() => global.URL.revokeObjectURL(url));

        return UrlAdapter.of({
            usingFile(file, process) {
                return Effect.acquireUseRelease(
                    acquire(file),
                    process,
                    release
                )
            },
        })
    }))
}