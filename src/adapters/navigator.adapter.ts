import { Context, Effect, Data, Layer, Option, pipe } from "effect"
import { DOMAdapter } from "./dom.adapter";

export class UnsupportedMediaError
extends Data.TaggedError("UnsupportedMediaError")<{}> {}

export class UnsupportedVideoError
extends Data.TaggedError("UnsupportedVideoError")<{ error: unknown }> {}

export declare namespace NavigatorAdapter {
    type UnsupportedError = UnsupportedMediaError | UnsupportedVideoError;
    type Shape={
        getVideo: () => Effect.Effect<MediaStream, UnsupportedError>;
    }
}

export class NavigatorAdapter
extends Context.Tag("NavigatorAdapter")<
    NavigatorAdapter,
    NavigatorAdapter.Shape
>(){
    static Live = Layer.effect(NavigatorAdapter, Effect.gen(function*(_){
        const global = yield* DOMAdapter.Global;

        return NavigatorAdapter.of({
            getVideo() {
                return pipe(
                    Option.fromNullable(global.navigator.mediaDevices),
                    Option.filter((media: MediaDevices): boolean => {
                        return media.getUserMedia !== undefined;
                    }),
                    Option.map(media => {
                        return Effect.tryPromise({
                            try(){
                                return media.getUserMedia({ video: { facingMode: "environment" } })
                            },
                            catch(error) {
                                return new UnsupportedVideoError({ error })
                            },
                        })
                    }),
                    Option.getOrElse(() => Effect.fail(new UnsupportedMediaError()))
                )
            },
        })
    }))
}