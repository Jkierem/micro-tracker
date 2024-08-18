import { Context, Effect, Layer, pipe } from "effect"
import { HttpAdapter, HttpError } from "../adapters/http.adapter";
import { UrlAdapter } from "../adapters/url.adapter";

export declare namespace FileService {
    type Shape = {
        getArrayBuffer: (file: File) => Effect.Effect<ArrayBuffer, HttpError>;
    }
}

export class FileService
extends Context.Tag("@service/url")<
    FileService,
    FileService.Shape
>(){
    static Live = Layer.effect(FileService, Effect.gen(function*(_){
        const http = yield* HttpAdapter;
        const url = yield* UrlAdapter;

        return FileService.of({
            getArrayBuffer(file) {
                return pipe(
                    url.usingFile(file, (uri) => http.get(uri)),
                    Effect.flatMap(proxy => proxy.arrayBuffer())
                )
            },
        })
    }))
}