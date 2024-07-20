import { Context, Effect, Layer } from "effect"

export declare namespace DOMAdapter {
    type Shape = {
        window: Effect.Effect<Window>
        document: Effect.Effect<Document>
    }
}

export class DOMAdapter extends Context.Tag("@adapters/dom")<
    DOMAdapter,
    DOMAdapter.Shape
>() {
    static Live = Layer.effect(DOMAdapter, Effect.gen(function*(_){
        const Window = Effect.succeed(window);
        const Document = Window.pipe(Effect.map(w => w.document));
        return DOMAdapter.of({
            window: Window,
            document: Document
        })
    }))
}