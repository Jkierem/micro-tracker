import { Context, Data, Effect, Layer } from "effect"
import { DOMAdapter } from "./dom.adapter";

export class InstantiateError
extends Data.TaggedError("InstantiateError")<{ error: unknown }> {}

export declare namespace WebAssemblyAdapter {
    type InstanceWrapper = WebAssembly.WebAssemblyInstantiatedSource;
    type Shape = {
        instantiate: (data: ArrayBuffer) => Effect.Effect<InstanceWrapper, InstantiateError>;
    }
}

export class WebAssemblyAdapter
extends Context.Tag("WebassemblyAdapter")<
    WebAssemblyAdapter,
    WebAssemblyAdapter.Shape
>(){
    static Live = Layer.effect(WebAssemblyAdapter, Effect.gen(function*(_){
        const global = yield* _(
            DOMAdapter,
            Effect.flatMap(dom => dom.window)
        );
        return WebAssemblyAdapter.of({
            instantiate(data) {
                return Effect.tryPromise({
                    try(){
                        return global.WebAssembly.instantiate(data);
                    },
                    catch(error) {
                        return new InstantiateError({ error })
                    },
                })
            },
        })
    }))
}