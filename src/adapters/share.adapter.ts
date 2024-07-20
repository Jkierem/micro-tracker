import { Context, Effect, Layer } from "effect"

export declare namespace ShareAdapter {
    type Shape = {
        send: (data: Uint8Array) => Effect.Effect<void>;
    }
}

export class ShareAdapter 
extends Context.Tag("@adapters/share")<
    ShareAdapter,
    ShareAdapter.Shape
>(){
    static Live = Layer.succeed(ShareAdapter, ShareAdapter.of({
        send() {
            return Effect.void;
        },
    }))
}