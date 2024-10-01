import { useState } from "react";
import { Services } from "../../services-provider/services.provider"
import { Action, ViewBase } from "../../view-base/view-base"
import { Data, Effect, Match, Option, pipe } from "effect";
import { ImageRepo } from "../../../adapters/image.repository";
import { useOptional } from "../../../support/effect/use-optional";
import { Modal } from "../../modal/modal";
import { Button } from "../../button/button";
import { Input } from "../../input/input";

type SnapshotData = [ArrayBuffer, ImageRepo.Dimensions]

type CameraState = Data.TaggedEnum<{
    Snapshot: { snap: SnapshotData },
    Capture: {}
}>

const { Snapshot, Capture } = Data.taggedEnum<CameraState>();

type FileInfo = {
    imageName?: string,
    patientName?: string,
}

export const Camera = () => {
    const { video, router, images } = Services.use();
    const [state, setState] = useState<CameraState>(Capture());
    const [candidate, setCandidate] = useOptional<SnapshotData>();
    const [fileInfo, setFileInfo] = useState<FileInfo>({});

    const [videoRef, canvasRef, controller] = video.useVideoCapture();

    controller.useCaptureOnMount();

    const handleCapture = () => {
        pipe(
            Match.value(state),
            Match.tag("Capture", () => {
                return pipe(
                    controller.takeSnapshot(),
                    Effect.zipLeft(controller.stopCapture()),
                    Effect.tap(snap => setState(Snapshot({ snap })))
                )
            }),
            Match.tag("Snapshot", ({ snap }) => {
                setCandidate(snap);
                return Effect.void;
            }),
            Match.exhaustive,
            Effect.runPromise
        )
    }

    const handleGoBack = () => {
        pipe(
            Match.value(state),
            Match.tag("Capture", () => {
                return pipe(
                    controller.stopCapture(),
                    Effect.zip(router.goBack())
                )
            }),
            Match.tag("Snapshot", () => {
                setState(Capture());
                return controller.startCapture();
            }),
            Match.exhaustive,
            Effect.runPromise
        )
    }

    const handleChangeFileInfo = (key: keyof FileInfo) => (next: string) => {
        setFileInfo(prev => ({ ...prev, [key]: next.length === 0 ? undefined : next}))
    }

    const handleSave = () => {
        pipe(
            Match.value(state),
            Match.tag("Snapshot", ({ snap: [data, dimensions] }) => {
                return Effect.gen(function*(){
                    const { imageName: rawImageName, patientName } = fileInfo
                    if( rawImageName && patientName ){
                        let imageName = rawImageName.trim();
                        if( !rawImageName.endsWith(".png") ){
                            imageName = `${imageName}.png`;
                        }

                        yield* images.save({
                            data: new Uint8Array(data),
                            dimensions,
                            fileType: "image/png",
                            imageName,
                            patientName,
                        })

                        setFileInfo({})
                        setState(Capture());
                        setCandidate();

                        yield* controller.startCapture();
                    }
                })
            }),
            Match.orElse(() => Effect.void),
            Effect.runPromise
        )
    }

    const handleAction = (action: Action) => {
        switch(action){
            case "back":
            case "delete":
                return handleGoBack();
            case "camera":
            case "upload":
                return handleCapture();
            default:
                break;
        }
    }

    return <ViewBase.Custom
        left={state._tag === "Capture" ? "back": "delete"}
        center={state._tag === "Capture" ? "camera" : "upload"}
        onAction={handleAction}
    >
        <Modal
            open={Option.isSome(candidate)}
            onClose={() => setCandidate()}
        >
            <h1 style={{ marginLeft: "6px", marginBottom: "18px"}}>Guardar Imagen</h1>
            <Input 
                wide
                placeholder="Nombre de Archivo" 
                value={fileInfo.imageName} 
                onChange={handleChangeFileInfo("imageName")}
            />
            <Input 
                wide
                placeholder="Nombre de Paciente" 
                value={fileInfo.patientName} 
                onChange={handleChangeFileInfo("patientName")}
            />
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                    marginTop: "10px"
                }}
            >
                <Button.Secondary 
                    color="red"
                    onClick={() => setCandidate()}
                >Cancel</Button.Secondary>
                <div style={{ width: "30px"}}></div>
                <Button.Primary 
                    color="green"
                    onClick={handleSave}
                >Guardar</Button.Primary>
            </div>
        </Modal>
        <video style={{ display: "none" }} ref={videoRef} />
        <canvas
            ref={canvasRef}
            width={640}
            height={480}
            style={{
                width: "100%",
                height: "100%"
            }}
        />
    </ViewBase.Custom>
}