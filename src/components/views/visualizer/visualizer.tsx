import { useEffect } from "react";
import { ImageLoader } from "../../../services/image-loader.service";
import { Services } from "../../services-provider/services.provider"
import { ViewBase } from "../../view-base/view-base";
import { Effect } from "effect";

export const Visualizer = ({ file }: { file: ImageLoader.FileContainer }) => {
    const { loader } = Services.use();

    const [canvasRef, _, imageController] = loader.useImageRenderer()

    useEffect(() => {
        imageController.render(file).pipe(Effect.runPromise);
    }, [])

    return <ViewBase action="menu">
        <canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
    </ViewBase>
}