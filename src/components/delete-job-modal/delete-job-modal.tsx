import { Effect, Option } from "effect"
import { Modal } from "../modal/modal"
import { Services } from "../services-provider/services.provider";
import { Button } from "../button/button";
import { JobRepo } from "../../adapters/job.repository";

type Props = {
    jobToDelete: Option.Option<JobRepo.Job>;
    onDelete: (e: Button.Event) => void;
    onCancel: (e: Button.Event) => void
}

export const DeleteJobModal = ({ jobToDelete, onDelete, onCancel }: Props) => {
    const { worker } = Services.use()

    const handleDelete = (e: Button.Event) => {
        e.stopPropagation();
        Effect.gen(function*(){
            const job = yield* jobToDelete;
            yield* worker.deleteJob(job);
            onDelete(e);
        }).pipe(Effect.runPromise)
    }

    const handleCancel = (e: Button.Event) => {
        e.stopPropagation();
        onCancel(e);
    }

    return <Modal open={Option.isSome(jobToDelete)}>
            <h1>
                Estas a punto de borrar un job asociado a la imagen{` `}{
                    jobToDelete.pipe(
                        Option.map(job => job.imageName),
                        Option.getOrElse(() => "")
                    )
                }
                {` `}y los resultados asociados
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