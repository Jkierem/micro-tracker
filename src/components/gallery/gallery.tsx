import { Effect, Match, Option, pipe } from "effect";
import { Services } from "../services-provider/services.provider"
import { useTiff } from "../image-viewer/image-viewer.helpers";
import { useState } from "react";
import { ImageRepo } from "../../adapters/image.repository";

export const Gallery = () => {
    const { images } = Services.use();
    const [current, setCurrent] = useState<ImageRepo.Image | undefined>(undefined);
    const [canvasRef, imageState, tiffController] = useTiff();

    const [imagesResource, refresh] = images.useAll();

    return <>
    <div>
        {
            pipe(
                imageState,
                Option.map(() => {
                    return <button
                        onClick={() => current && images
                            .update(current)
                            .pipe(Effect.tap(() => refresh({ swr: true })))
                            .pipe(Effect.runPromise)}
                    >Update</button>
                }),
                Option.getOrElse(() => <></>)
            )
        }
    </div>
    <div>
        <canvas ref={canvasRef} />
    </div>
    <div>
    {pipe(
        Match.value(imagesResource),
        Match.tag("Loading", () => <>Loading...</>),
        Match.tag("Success", ({ data }) => <div>
            {data.map(image => {
                return <div key={image.id}>
                    ID: {image.id} ; Name: {image.imageName} ; last: {image.updatedAt.getTime()}
                    <button onClick={() => {
                        if( image.fileType === "image/tiff" ){
                            tiffController
                            .load(image)
                            .pipe(Effect.tap(() => setCurrent(image)))
                            .pipe(Effect.runPromise)
                        } else {
                            const raw = new Blob([image.data], { type: "image/png" });
                            window.createImageBitmap(raw).then(bitmap => {
                                canvasRef.current!.width = bitmap.width
                                canvasRef.current!.height = bitmap.height
                                const ctx = canvasRef.current?.getContext("2d");
                                ctx?.drawImage(bitmap, 0, 0);
                            })
                        }
                    }}>View</button>
                    <button
                        onClick={() => {
                            images
                            .delete(image.id)
                            .pipe(
                                Effect.tap(() => {
                                    refresh({ swr: true })
                                    if( current && current.id === image.id ){
                                        setCurrent(undefined);
                                        return tiffController.close().pipe(Effect.runPromise);
                                    }
                                }), 
                                Effect.runPromise
                            )
                        }}
                    >Delete</button>
                </div>
            })}
        </div>),
        Match.tag("Error", ({ error }) => {
            console.log(error)
            return <>error</>
        }),
        Match.orElse(() => <></>)
    )}
    </div>
    </>
}