import { Context, Data, Effect, Layer, pipe } from "effect";
import UTIF from "utif"

class DecodeError 
extends Data.TaggedError("DecodeError")<{ error: unknown }> {}
class ExtendImageError
extends Data.TaggedError("ExtendImageError")<{ error: unknown }> {}
class ConversionError
extends Data.TaggedError("ConversionError")<{ error: unknown }> {}
export type ProcessingError = 
    | DecodeError
    | ExtendImageError
    | ConversionError

export declare namespace TIFFAdapter {
    type Shape = {
        decode: (buffer: Buffer | ArrayBuffer) => Effect.Effect<UTIF.IFD[], DecodeError>;
        decodeImage: (buffer: Buffer | ArrayBuffer, ifd: UTIF.IFD) => Effect.Effect<void, ExtendImageError>;
        toRGBA8: (ifd: UTIF.IFD) => Effect.Effect<Uint8Array, ConversionError>;
    }
}

export class TIFFAdapter extends Context.Tag("@adapters/tiff")<
    TIFFAdapter,
    TIFFAdapter.Shape
>() {
    static Live = Layer.effect(TIFFAdapter, Effect.gen(function*(_){
        return TIFFAdapter.of({
            decode: (buffer) => {
                return pipe(
                    Effect.try(() => UTIF.decode(buffer)),
                    Effect.mapError(error => new DecodeError({ error }))
                )
            },
            decodeImage: (buffer, ifd) => {
                return pipe(
                    Effect.try(() => UTIF.decodeImage(buffer, ifd)),
                    Effect.mapError(error => new ExtendImageError({ error }))
                )
            },
            toRGBA8: (ifd) => {
                return pipe(
                    Effect.try(() => UTIF.toRGBA8(ifd)),
                    Effect.mapError(error => new ConversionError({ error }))
                )
            }
        })
    }))
}