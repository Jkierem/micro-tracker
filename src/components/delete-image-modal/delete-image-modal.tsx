import { Effect, Option } from "effect"
import { ImageRepo } from "../../adapters/image.repository"
import { Modal } from "../modal/modal"
import { Services } from "../services-provider/services.provider";
import { Button } from "../button/button";

type Props = {
    imageToDelete: Option.Option<ImageRepo.Image>;
    onDelete: (e: Button.Event) => void;
    onCancel: (e: Button.Event) => void
}

export const DeleteImageModal = ({ imageToDelete, onDelete, onCancel }: Props) => {
    const { images } = Services.use()

    const handleDelete = (e: Button.Event) => {
        e.stopPropagation();
        Effect.gen(function*(){
            const image = yield* imageToDelete;
            yield* images.delete(image.id);
            onDelete(e);
        }).pipe(Effect.runPromise)
    }

    const handleCancel = (e: Button.Event) => {
        e.stopPropagation();
        onCancel(e);
    }

    return <Modal open={Option.isSome(imageToDelete)}>
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
                        onClick={handleCancel}
                    >Cancel</Button.Primary>
                    <Button.Secondary 
                        color="red"
                        onClick={handleDelete}
                    >Borrar</Button.Secondary>
                </div>
        </Modal>
}