import { useState } from "react";
import { Services } from "../../services-provider/services.provider"
import { Action, ViewBase } from "../../view-base/view-base"
import { Data, Effect, Match, pipe } from "effect";
import { useOptional } from "../../../support/effect/use-optional";
import { SaveSnapshotModal } from "../../save-snapshot-modal/save-snapshot-modal";
import { VideoService } from "../../../services/video.service";

type CameraState = Data.TaggedEnum<{
    Snapshot: { snap: VideoService.Snapshot },
    Capture: {}
}>

const { Snapshot, Capture } = Data.taggedEnum<CameraState>();


export const Camera = () => {
    const { video, router } = Services.use();
    const [state, setState] = useState<CameraState>(Capture());
    const [candidate, setCandidate] = useOptional<VideoService.Snapshot>();

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

    const handleSave = () => {
        pipe(
            Match.value(state),
            Match.tag("Snapshot", () => {
                return Effect.gen(function*(){
                    setState(Capture());
                    setCandidate();

                    yield* controller.startCapture();
                })
            }),
            Match.orElse(() => Effect.void),
            Effect.runPromise
        )
    }

    const handleGoToGallery = () => {
        Effect.all([
            controller.stopCapture(),
            router.goToGalleryEffect(),
        ]).pipe(Effect.runPromise)
    }

    const handleAction = (action: Action) => {
        switch(action){
            case "back":
            case "delete":
                return handleGoBack();
            case "camera":
            case "upload":
                return handleCapture();
            case "gallery":
                return handleGoToGallery();
            default:
                break;
        }
    }

    return <ViewBase.Custom
        left={state._tag === "Capture" ? "back": "delete"}
        center={state._tag === "Capture" ? "camera" : "upload"}
        right={state._tag === "Capture" ? "gallery" : undefined}
        onAction={handleAction}
    >
        <SaveSnapshotModal
            candidate={candidate}
            onAccept={handleSave}
            onCancel={() => setCandidate()}
        />
        <video style={{ display: "none" }} ref={videoRef} />
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%"
            }}
        />
    </ViewBase.Custom>
}