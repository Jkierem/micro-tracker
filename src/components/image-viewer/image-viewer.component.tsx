import React, { useEffect, useRef, useState } from "react";
import { Services } from "../services-provider/services-provider.component"
import { Effect, Match, Option, Number, pipe } from "effect";
import { renderTiff, resetImageState } from "./image-viewer.helpers";
import { ImageState } from "./image-viewer.types";

export const ImageViewer = () => {
    const { tiffLoader } = Services.use();

    const [loadedImageData, setLoadedImage] = useState<Option.Option<ImageState>>(Option.none);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        pipe(
            loadedImageData,
            Option.map(({ currentSlice, tiff }) => {
                renderTiff(canvasRef, tiff.slices[currentSlice])
            })
        )
    }, [loadedImageData])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        pipe(
            Effect.fromNullable(files),
            Effect.flatMap(files => Effect.fromNullable(files[0])),
            Effect.tap(() => setLoadedImage(resetImageState)),
            Effect.map(file => URL.createObjectURL(file)),
            Effect.bindTo("url"),
            Effect.bind("tiff", ({ url }) => tiffLoader.fromURL(url)),
            Effect.tap(({ tiff, url }) => {
                setLoadedImage(Option.some({
                    tiff,
                    currentSlice: 0,
                    resourceUrl: url,
                }))
            }),
            Effect.catchAll(e => {
                return Effect.sync(() => console.error(e))
            }),
            Effect.runPromise
        )
    }

    const handlePageChange = (delta: 1 | -1) => () => {
        setLoadedImage(prev => {
            return pipe(
                prev,
                Option.map((data) => {
                    return pipe(
                        data.currentSlice + delta,
                        Option.liftPredicate(Number.between({
                            minimum: 0,
                            maximum: data.tiff.slices.length - 1
                        })),
                        Option.map(currentSlice => ({
                            ...data,
                            currentSlice
                        })),
                        Option.getOrElse(() => data)
                    )
                })
            )
        })
    }

    return <div>
        <div>
            <input
                type="file"
                onChange={handleChange}
            />
        </div>
        {
            pipe(
                loadedImageData,
                Match.value,
                Match.tag("Some", ({ value }) => {
                    return <div>
                        <button onClick={handlePageChange(-1)}>{"<-"}</button>
                        <button onClick={handlePageChange(1)}>{"->"}</button>
                        <p>{value.currentSlice + 1} / {value.tiff.slices.length}</p>
                    </div>
                }),
                Match.orElse(() => <></>)
            )
        }
        <div>
            <canvas ref={canvasRef} />
        </div>
    </div>
}