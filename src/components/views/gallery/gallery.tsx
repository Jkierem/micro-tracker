import styled from "styled-components";
import { Services } from "../../services-provider/services.provider"
import { navitemHeight, ViewBase } from "../../view-base/view-base"
import { Effect, Match, Option, pipe } from "effect";
import { Resource } from "../../../support/effect";
import { useOptional } from "../../../support/effect/use-optional";
import { ImageRepo } from "../../../adapters/image.repository";
import { VisualizerDataTypes } from "../../../support/routing/views";
import { DeleteImageModal } from "../../delete-image-modal/delete-image-modal";
import { Icon } from "../../icon/icon";
import { Loader } from "../../loader/loader";
import { formatDate } from "../../../support/optics/date-formatter";

const Content = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    padding: min(20px, 10%);
    box-sizing: border-box;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-bottom: calc(${navitemHeight} / 2);
`

const Row = styled.div`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    min-height: min(10%, 40px);
    padding: min(10%, 5px);
    font-family: Arial, Helvetica, sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 12px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);

    & img {
        max-height: 100%;
        box-sizing: border-box;
    }
`

export const Gallery = () => {
    const { images, router } = Services.use();
    const [imageToDelete, setImageToDelete] = useOptional<ImageRepo.Image>();
    const [imagesResource, refresh] = images.useAll();

    const imageList = pipe(
        imagesResource,
        Resource.withEmpty((images) => images.length === 0)
    )

    const handleOpenImage = (image: ImageRepo.Image) => () => {
        router.goToVisualizer({ data: VisualizerDataTypes.Image({ image }) });
    }

    const handleDelete = () => {
        Effect.gen(function*(_){
            refresh().pipe(
                Option.map(p => {
                    p.catch(e => console.error("Issue refetching", e))
                })
            );
            setImageToDelete()
        }).pipe(
            Effect.catchAll(e => {
                return Effect.logError(e)
            }),
            Effect.runPromise
        )
    }

    return <ViewBase>
        <DeleteImageModal
            imageToDelete={imageToDelete}
            onCancel={() => setImageToDelete()}
            onDelete={handleDelete}
        />
        <Content>
            {pipe(
                Match.value(imageList),
                Match.tag("Loading", () => <Loader />),
                Match.tag("Error", () => <p>Somehting Went Wrong</p>),
                Match.tag("Empty", () => <h1>-- No Images --</h1>),
                Match.tag("Success", ({ data }) => {
                    return data.map((image, idx) => {
                        return <Row key={`${image.id}+${idx}`} onClick={handleOpenImage(image)}>
                            <div style={{ marginLeft: "16px" }}>{image.imageName}</div>
                            <div>{image.patientName}</div>
                            <div>{formatDate(image.updatedAt)}</div>
                            <div 
                                style={{ height: "30%", position: "relative", marginRight: "16px" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageToDelete(image);
                                }}
                            >
                                <Icon name="close" />
                            </div>
                        </Row>
                    })
                }),
                Match.exhaustive
            )}
        </Content>
    </ViewBase>
}