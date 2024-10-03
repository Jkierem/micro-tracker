import { Context, Data, Effect, Layer, Option, pipe } from "effect";
import React, { useRef, useState } from "react";
import { FileType, ImageRepo } from "../adapters/image.repository";
import { ProcessingError, TIFFAdapter } from "../adapters/tiff.adapter";
import { BitmapAdapter, CanvasContextError, RenderError } from "../adapters/bitmap.adapter";
import { FileService } from "./file.service";
import { Schema } from "@effect/schema";
import { HttpError } from "../adapters/http.adapter";

export class NullCanvasError
extends Data.TaggedError("NullCanvasError") {}

export class UnsupportedFileError
extends Data.TaggedError("UnsupportedFileError")<{ fileType: string }> {}

export class FileContainer {
    private constructor(
        readonly data: Uint8Array,
        readonly type: ImageRepo.FileType
    ){}

    public static make({ data, type }: { data: Uint8Array, type: ImageRepo.FileType }){
        return new FileContainer(data, type);
    }

    public static fromImage(image: ImageRepo.Image){
        return new FileContainer(image.data, image.fileType);
    }
}

export declare namespace ImageLoader {
    type CanvasError = NullCanvasError | CanvasContextError;
    type CanvasRef = React.RefObject<HTMLCanvasElement>;
    
    type ClearError  = CanvasError;
    type UpdateError = ClearError  | RenderError;
    type LoadError   = UpdateError | ProcessingError;
    type VerifyError = UnsupportedFileError | HttpError;

    type FileContainer = {
        data: Uint8Array,
        type: ImageRepo.FileType
    }

    type ImageState = Option.Option<{
        dimensions: ImageRepo.Dimensions,
        fileType: ImageRepo.FileType,
        raw: ArrayBuffer,
        current: number,
        slices: Uint8Array[]
    }>
    
    type ImageController = {
        render: (file: FileContainer) => Effect.Effect<void, LoadError>,
        clear: () => Effect.Effect<void, ClearError>;
        update: (fn: (prev: ImageState) => ImageState) => Effect.Effect<void, UpdateError>;
    }

    type Shape = {
        verifyFile: (file: File) => Effect.Effect<FileContainer, VerifyError>;
        useImageRenderer: () => [CanvasRef, ImageState, ImageController];
    }
}
export class ImageLoader
extends Context.Tag("@service/image-loader")<
    ImageLoader,
    ImageLoader.Shape
>(){
    static Live = Layer.effect(ImageLoader, Effect.gen(function*(_){
        const tiff = yield* TIFFAdapter;
        const Bitmap = yield* BitmapAdapter; 
        const fileService = yield* FileService;

        return ImageLoader.of({
            verifyFile(file) {
                return Effect.gen(this, function*(_){
                    const fileType = yield* _(
                        Schema.decodeUnknown(FileType)(file.type),
                        Effect.mapError(() => new UnsupportedFileError({ fileType: file.type }))
                    );
                    const buffer = yield* fileService.getArrayBuffer(file);
                    const data = new Uint8Array(buffer);
                    return FileContainer.make({
                        data,
                        type: fileType
                    })
                })
            },
            useImageRenderer() {
                const [current, setCurrent] = useState<ImageLoader.ImageState>(Option.none());
                const canvasRef = useRef<HTMLCanvasElement>(null);

                const Canvas = Effect.suspend(() => pipe(
                    Option.fromNullable(canvasRef.current),
                    Effect.mapError(() => new NullCanvasError())
                ))

                const CanvasContex = pipe(
                    Canvas,
                    Effect.bindTo("canvas"),
                    Effect.bind("ctx", ({ canvas }) => Option.fromNullable(canvas.getContext("2d"))),
                    Effect.mapError(() => new CanvasContextError()),
                    Effect.map(({ canvas, ctx }) => [canvas, ctx] as const)
                )

                const controller: ImageLoader.ImageController = {
                    render({ data, type: fileType }) {
                        return this.clear().pipe(
                            Effect.flatMap(() => {
                                return Effect.gen(function*(_){
                                    let slices = []
                                    let dimensions: ImageRepo.Dimensions;
                                    const [canvas, ctx] = yield* CanvasContex;
                                    if( fileType === "image/tiff" ){
                                        const ifds = yield* tiff.decode(data.buffer);
                                        slices = yield* Effect.all(ifds.map(ifd => {
                                            return pipe(
                                                tiff.decodeImage(data, ifd),
                                                Effect.zipRight(tiff.toRGBA8(ifd))
                                            )
                                        }))
                                        const ifd = ifds[0];
                                        const slice = slices[0];
                                        const cvImage = ctx.createImageData(ifd.width, ifd.height);
                                        cvImage.data.set(slice);
                                        dimensions = yield* Bitmap.draw(cvImage, canvas);
                                    } else {
                                        slices = [data];
                                        const slice = slices[0];
                                        dimensions = yield* Bitmap.draw(slice, canvas);
                                    }
                                    setCurrent(Option.some({
                                        dimensions,
                                        slices,
                                        fileType,
                                        current: 0,
                                        raw: data.buffer,
                                    }))
                                })
                            }),
                        )
                    },
                    clear() {
                        return Effect.gen(function* (_){
                            const [canvas, ctx] = yield* CanvasContex
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            setCurrent(Option.none());
                        })
                    },
                    update(fn) {
                        return pipe(
                            Effect.sync(() => fn(current)),
                            Effect.tap((next) => setCurrent(next)),
                            Effect.flatMap((stateM) => {
                                return Effect.gen(function*(_){
                                    const state = yield* stateM;
                                    const slice = state.slices[state.current];
                                    const [canvas, ctx] = yield* CanvasContex;
                                    if( state.fileType === "image/tiff" ){
                                        const { width, height } = state.dimensions;
                                        const cvImage = ctx.createImageData(width, height);
                                        cvImage.data.set(slice);
                                        return yield* Bitmap.draw(cvImage, canvas);
                                    } else {
                                        return yield* Bitmap.draw(slice, canvas);
                                    }
                                })
                            }),
                            Effect.catchTag("NoSuchElementException", () => Effect.void)
                        )
                    },
                }
                
                return [canvasRef, current, controller];
            }
        })
    }))
}