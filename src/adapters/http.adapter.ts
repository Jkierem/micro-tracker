import { Context, Data, Effect, Layer, pipe } from "effect"
import { DOMAdapter } from "./dom.adapter"

class RequestError 
extends Data.TaggedError("RequestError")<{ error: unknown }> {}
class ProcessingError
extends Data.TaggedError("ProcessingError")<{ error: unknown }> {}
export type HttpError = RequestError | ProcessingError;

type ResponseProxy = {
    [P in keyof Response]: 
        Response[P] extends () => infer A ? 
            A extends Promise<infer B> 
            ? () => Effect.Effect<B> 
            : () => Effect.Effect<A>
        : Response[P]
}

const makeResponseProxy = (response: Response) => {
    return new Proxy(response, {
        get(target, p: keyof Response) {
            if( target[p] instanceof Function ){
                return () => Effect.tryPromise({
                    try: async () => (target[p] as Function)(),
                    catch: error => new ProcessingError({ error })
                })
            }
            return target[p];
        },
    }) as unknown as ResponseProxy
} 

export declare namespace HttpAdapter {
    type Shape = {
        get: (url: string) => Effect.Effect<ResponseProxy, HttpError>;
    }
}

export class HttpAdapter extends Context.Tag("@adapters/http")<
    HttpAdapter,
    HttpAdapter.Shape
>(){
    static Live = Layer.effect(HttpAdapter, Effect.gen(function*(_){
        const Window = yield* _(
            DOMAdapter,
            Effect.flatMap(adapter => adapter.window)
        );

        return HttpAdapter.of({
            get(url) {
                return pipe(
                    Effect.tryPromise({
                        try: (signal) => Window.fetch(url, { signal }),
                        catch: error => new RequestError({ error })
                    }),
                    Effect.map(makeResponseProxy)
                )
            },
        })
    }))
}
