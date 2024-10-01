import styled, { keyframes } from "styled-components";
import { Services } from "../services-provider/services.provider"
import { ViewBase } from "../view-base/view-base"
import { Effect, Match, Option, pipe } from "effect";
import { Resource } from "../../support/effect";
import { Modal } from "../modal/modal";
import { useOptional } from "../../support/effect/use-optional";
import { ImageRepo } from "../../adapters/image.repository";
import { Button } from "../button/button";

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
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Loader = styled.div`
    margin-block: auto;
    width: min(60px, 10vh);
    height: min(60px, 10vh);
    background-color: white;
    border: 2px solid black;
    border-radius: 50%;
    border-left: 2px solid white;
    animation: ${rotate} 0.8s linear infinite;
`

const Row = styled.div`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    height: min(10%, 40px);
    padding: min(10%, 5px);
    font-family: Arial, Helvetica, sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 12px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`

export const Gallery = () => {
    const { images } = Services.use();
    const [imageToDelete, setImageToDelete] = useOptional<ImageRepo.Image>();
    const [imagesResource, refresh] = images.useAll();

    const imageList = pipe(
        imagesResource,
        Resource.withEmpty((images) => images.length === 0)
    )

    const handleDelete = () => {
        Effect.gen(function*(_){
            const image = yield* imageToDelete;
            yield* images.delete(image.id);

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
        <Modal open={Option.isSome(imageToDelete)}>
            <h1>
                Estas a punto de borrar {
                    imageToDelete.pipe(
                        Option.map(image => image.imageName),
                        Option.getOrElse(() => "")
                    )
                }
                </h1>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-around",
                        alignItems: "center",
                        marginTop: "10px"
                    }}
                >
                    <Button.Primary 
                        color="red"
                        onClick={() => setImageToDelete()}
                    >Cancel</Button.Primary>
                    <Button.Secondary 
                        color="red"
                        onClick={handleDelete}
                    >Borrar</Button.Secondary>
                </div>
        </Modal>
        <Content>
            {pipe(
                Match.value(imageList),
                Match.tag("Loading", () => <Loader />),
                Match.tag("Error", () => <p>Somehting Went Wrong</p>),
                Match.tag("Empty", () => <h1>-- No Images --</h1>),
                Match.tag("Success", ({ data }) => {
                    return data.map((image, idx) => {
                        return <Row key={`${image.id}+${idx}`}>
                            <div>{image.imageName}</div>
                            <div>{image.patientName}</div>
                            <div>{image.updatedAt.toISOString()}</div>
                            <div onClick={() => setImageToDelete(image)}>X</div>
                        </Row>
                    })
                }),
                Match.exhaustive
            )}
        </Content>
    </ViewBase>
}