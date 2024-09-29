import React from "react";
import { Effect, Match, Number, Option, pipe } from "effect";
import { Services } from "../services-provider/services.provider";

export const ImageViewer = () => {
    const { images, loader } = Services.use();

    const [canvasRef, imageState, imageController] = loader.useImageLoader();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        pipe(
            Effect.fromNullable(files),
            Effect.flatMap(files => Effect.fromNullable(files[0])),
            Effect.flatMap(file => imageController.upload(file)),
            Effect.catchTag("UnsupportedFileError", (e) => {
                alert(`The ${e.fileType} file format is not supported`)
                return Effect.void;
            }),
            Effect.runPromise
        )
    }

    const handlePageChange = (delta: 1 | -1) => () => {
        pipe(
            imageController.update((prev) => {
                return pipe(
                    prev,
                    Option.filter((state) => state.fileType === "image/tiff"),
                    Option.map(state => {
                        const nextValue = state.current + delta;
                        if( Number.between({
                            minimum: 0,
                            maximum: state.slices.length
                        })(nextValue)){
                            return {
                                ...state,
                                current: nextValue
                            }
                        }
                        return state
                    }),
                    res => Option.isNone(res) ? prev : res
                )
            })
        )
    }

    return <div>
        <div>
            <button onClick={() => {
                imageState.pipe(
                    Option.map(({ fileType, raw, dimensions }) => {
                        images.save({
                            fileType,
                            data: new Uint8Array(raw),
                            imageName: "test-1",
                            patientName: "test-1",
                            dimensions,
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
                imageState,
                Option.filter((state) => {
                    return state.fileType === "image/tiff" && state.slices.length > 1
                }),
                Match.value,
                Match.tag("Some", ({ value }) => {
                    return <div>
                        <button onClick={handlePageChange(-1)}>{"<-"}</button>
                        <button onClick={handlePageChange(1)}>{"->"}</button>
                        <p>{value.current + 1} / {value.slices.length}</p>
                    </div>
                }),
                Match.orElse(() => <></>)
            )
        }
        <div>
            <canvas 
                style={{
                    maxWidth: 700,
                    maxHeight: 700
                }}
                ref={canvasRef} />
        </div>
    </div>
}