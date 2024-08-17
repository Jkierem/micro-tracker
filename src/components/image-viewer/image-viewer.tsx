import React from "react";
import { Effect, Match, Option, pipe } from "effect";
import { useTiff } from "./image-viewer.helpers";
import { Services } from "../services-provider/services.provider";

export const ImageViewer = () => {
    const { images } = Services.use();

    const [canvasRef, loadedImageData, tiffController] = useTiff();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        pipe(
            Effect.fromNullable(files),
            Effect.flatMap(files => Effect.fromNullable(files[0])),
            Effect.flatMap(file => tiffController.upload(file)),
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
            <button onClick={() => {
                loadedImageData.pipe(
                    Option.map((state) => {
                        return new Uint8Array(state.tiff.raw);
                    }),
                    Option.map((data) => {
                        images.save({
                            data,
                            imageName: "test-1",
                            patientName: "test-1",
                            fileType: "image/tiff"
                        }).pipe(
                            Effect.tap((res) => {
                                console.log("Saved file successfuly", res);
                            }),
                            Effect.runPromise
                        )
                    })
                )
            }}>Save</button>
        </div>
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