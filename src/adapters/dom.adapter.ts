import { Context, Effect, Layer, pipe } from "effect"

export declare namespace DOMAdapter {
    type Shape = {
        global: Effect.Effect<typeof globalThis>
    }
}

export class DOMAdapter extends Context.Tag("@adapters/dom")<
    DOMAdapter,
    DOMAdapter.Shape
>() {
    static Live = Layer.succeed(
        DOMAdapter,  
        DOMAdapter.of({
            global: Effect.suspend(() => Effect.succeed(globalThis))
        })
    )

    static Global = pipe(
        DOMAdapter,
        Effect.flatMap(dom => dom.global)
    )
}