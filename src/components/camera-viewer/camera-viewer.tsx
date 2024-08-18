import { Effect, Option, pipe } from "effect";
import { Services } from "../services-provider/services.provider"
import { useOptional } from "../../support/effect/use-optional";
import { ImageRepo } from "../../adapters/image.repository";

export const CameraViewer = () => {
    const { video, router, images } = Services.use();

    const [videoRef, canvasRef, controller] = video.useVideoCapture();

    const [currentSnap, setSnap] = useOptional<[ArrayBuffer, ImageRepo.Dimensions]>();

    return <>
        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "center" }}>
            <video ref={videoRef} autoPlay />
            <canvas ref={canvasRef} />
        </div>
        <div>
            <button onClick={() => {
                pipe(
                    controller.stopCapture(),
                    Effect.zipRight(router.goBack()),
                    Effect.runPromise
                )
            }}>Go back</button>
            <button onClick={() => controller.stopCapture().pipe(Effect.runPromise)}>Stop</button>
            <button onClick={() => controller.startCapture().pipe(Effect.runPromise)}>Start</button>
            <button onClick={() => controller.takeSnapshot().pipe(
                Effect.tap(data => setSnap(data)),
                Effect.runPromise
            )}>Snap</button>
            <button disabled={Option.isNone(currentSnap)} onClick={() => {
                pipe(
                    currentSnap,
                    Effect.tap(([data, dimensions]) => {
                        return images.save({
                            dimensions,
                            data: new Uint8Array(data),
                            fileType: "image/png",
                            imageName: "snap-1",
                            patientName: "snap-1"
                        })
                    }),
                    Effect.runPromise
                )
            }}>Save</button>
        </div>
    </>
}