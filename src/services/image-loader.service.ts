import { Context, Effect, Layer, pipe } from "effect"
import { ProcessingError, TIFFAdapter } from "../adapters/tiff.adapter"
import { HttpAdapter, HttpError } from "../adapters/http.adapter"
import { IFD } from "utif"

export declare namespace ImageLoader {
    type Slice = {
        data: Uint8Array,
        ifd: IFD
    }

    type TIFF = {
        raw: ArrayBuffer,
        slices: Slice[]
    }

    type Shape = {
        fromURL: (url: string) => Effect.Effect<TIFF, ProcessingError | HttpError>;
        fromArrayBuffer: (data: ArrayBuffer) => Effect.Effect<TIFF, ProcessingError>;
    }
}

export class ImageLoader 
extends Context.Tag("@services/image-processor")<
    ImageLoader,
    ImageLoader.Shape
>(){
    static Live = Layer.effect(ImageLoader, Effect.gen(function*(_){
        const http = yield* _(HttpAdapter);
        const tiff = yield* _(TIFFAdapter);

        return ImageLoader.of({
            fromArrayBuffer(data) {
                return pipe(
                    tiff.decode(data),
                    Effect.flatMap(ifds => Effect.all(
                        ifds.map(ifd => pipe(
                            tiff.decodeImage(data, ifd),
                            Effect.flatMap(() => tiff.toRGBA8(ifd)),
                            Effect.bindTo("data"),
                            Effect.let("ifd", () => ifd),
                        ))
                    )),
                    Effect.bindTo("slices"),
                    Effect.let("raw", () => data)
                )
            },
            fromURL(url) {
                return Effect.gen(this, function*(_){
                    const data = yield* _(
                        http.get(url),
                        Effect.flatMap(response => response.arrayBuffer())
                    );
                    return yield* _(this.fromArrayBuffer(data));
                })
            },
        })
    }))
}