import React from "react";
import { Effect, Match, pipe } from "effect";
import { useTiff } from "./image-viewer.helpers";

export const ImageViewer = () => {
    const [canvasRef, loadedImageData, tiffController] = useTiff();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        pipe(
            Effect.fromNullable(files),
            Effect.flatMap(files => Effect.fromNullable(files[0])),
            Effect.flatMap(file => tiffController.load(file)),
            Effect.runPromise
        )
    }

    const handlePageChange = (delta: 1 | -1) => () => {
        pipe(
            delta === 1 ? tiffController.next() : tiffController.prev(),
            Effect.runPromise
        )
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