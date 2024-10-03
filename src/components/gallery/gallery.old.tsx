import { Effect, Match, Option, pipe } from "effect";
import { Services } from "../services-provider/services.provider";
import { ImageRepo } from "../../adapters/image.repository";
import { useOptional } from "../../support/effect/use-optional";
import { Resource } from "../../support/effect";

export const Gallery = () => {
    const { images, loader } = Services.use();
    const [displayed, setDisplayed] = useOptional<ImageRepo.Image>();
    const [canvasRef, _, imageController] = loader.useImageRenderer();
    const [imagesResource, refresh] = images.useAll();

    const imageList = pipe(
        imagesResource,
        Resource.withEmpty((images) => images.length === 0)
    )

    return <>
        <div>
            <canvas ref={canvasRef} />
        </div>
        <div>
            {
                pipe(
                    Match.value(imageList),
                    Match.tag("Empty", () => <div>-- No Saved Images --</div>),
                    Match.tag("Error", () => <div>-- Error loading images --</div>),
                    Match.tag("Loading", () => <div>-- Loading --</div>),
                    Match.tag("Success", ({ data }) => {
                        return data.map(image => {
                            return <div key={image.id}>
                                ID: {image.id} ; Name: {image.imageName} ; Type: {image.fileType}{` `}
                                <button
                                    onClick={() => {
                                        pipe(
                                            imageController.render({
                                                data: image.data, 
                                                type: image.fileType
                                            }),
                                            Effect.tap(() => setDisplayed(image)),
                                            Effect.runPromise
                                        )
                                    }}
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => {
                                        pipe(
                                            images.delete(image.id),
                                            Effect.tap(() => { refresh({ swr: true }) }),
                                            Effect.tap(() => {
                                                if( Option.isSome(displayed) && displayed.value.id === image.id ){
                                                    return pipe(
                                                        imageController.clear(),
                                                        Effect.tap(() => setDisplayed(undefined))
                                                    )
                                                }
                                                return Effect.void;
                                            }),
                                            Effect.runPromise
                                        )
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        })
                    }),
                    Match.exhaustive
                )
            }
        </div>
    </>
}