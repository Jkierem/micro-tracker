import React, { useState } from "react";
import { FileContainer, ImageLoader } from "../../../services/image-loader.service";
import { Services } from "../../services-provider/services.provider";
import { ViewBase } from "../../view-base/view-base";
import { Effect, pipe } from "effect";
import { Menu } from "../../menu/menu";
import { SaveSnapshotModal } from "../../save-snapshot-modal/save-snapshot-modal";
import { useOptional } from "../../../support/effect/use-optional";
import { ImageRepo } from "../../../adapters/image.repository";
import { VisualizerDataTypes } from "../../../support/routing/views";
import { TiffViewer } from "./tiff-viewer";

export const FileVisualizer = ({ file }: { file: FileContainer }) => {
    const { loader, router } = Services.use()
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [candidate, setCandidate] = useOptional<ImageLoader.Snapshot>();
    const [canvasRef, state, controller] = loader.useImageRenderer();

    controller.useRenderOnMount(file);

    const handlePickSlice = (e: React.MouseEvent) => {
        e.stopPropagation();
        pipe(
            controller.takeSnapshot(),
            Effect.andThen(snapshot => setCandidate(snapshot)),
            Effect.runPromise
        )
    }

    const handleSave = (image: ImageRepo.Image) => {
        Effect.all([
            controller.clear(),
            router.replaceToVisualizerEffect({ data: VisualizerDataTypes.Image({ image })})
        ]).pipe(Effect.runPromise)
    }

    return <ViewBase action={menuOpen ? "close" : "menu"} onAction={() => setMenuOpen(a => !a)}>
        <SaveSnapshotModal
            candidate={candidate}
            onCancel={() => setCandidate()}
            onAccept={handleSave}
        />
        <Menu open={menuOpen} setOpen={setMenuOpen} >
            <div onClick={handlePickSlice}>Guardar{` `}{file.type === "image/tiff" ? "Corte": "Imagen"}...</div>
            <div>Procesar</div>
            <div>Descartar</div>
        </Menu>
        {file.type === "image/tiff"
            ? <TiffViewer
                canvasRef={canvasRef}
                state={state}
                controller={controller}
            />
            : <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }}/>}
    </ViewBase>
}