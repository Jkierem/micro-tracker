import { Effect, Option, pipe } from "effect";
import { Services } from "../services-provider/services.provider"
import { useState } from "react";

export const CameraViewer = () => {
    const { video, router, images } = Services.use();

    const [videoRef, canvasRef, controller] = video.useVideoCapture();

    const [currentSnap, setSnap] = useState(Option.none<ArrayBuffer>());

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
                Effect.tap(data => setSnap(Option.some(data))),
                Effect.runPromise
            )}>Snap</button>
            <button disabled={Option.isNone(currentSnap)} onClick={() => {
                pipe(
                    currentSnap,
                    Effect.tap(data => {
                        return images.save({
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