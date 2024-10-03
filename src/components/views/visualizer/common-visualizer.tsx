import React, { useEffect, useState } from "react";
import { FileContainer } from "../../../services/image-loader.service";
import { Services } from "../../services-provider/services.provider";
import { ViewBase } from "../../view-base/view-base";
import { Effect } from "effect";
import { ImageRepo } from "../../../adapters/image.repository";
import { Menu } from "../../menu/menu";
import { DeleteImageModal } from "../../delete-image-modal/delete-image-modal";
import { useOptional } from "../../../support/effect/use-optional";

export const CommonVisualizer = ({ image }: { image: ImageRepo.Image }) => {
    const { loader, router } = Services.use()
    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [imageToDelete, setImageToDelete] = useOptional<ImageRepo.Image>();

    const  [canvasRef, _, controller] = loader.useImageRenderer();

    useEffect(() => {
        controller
            .render(FileContainer.fromImage(image))
            .pipe(Effect.runPromise);
    },[])

    const handleMenuToggle = () => {
        setMenuOpen(a => !a);
    }

    const handleDelete = () => {
        setImageToDelete()
        router.goBack().pipe(Effect.runPromise)
    }

    const handleSendToProcess = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(false);
    }

    const handleSetCandidate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageToDelete(image);
    }

    return <ViewBase onAction={handleMenuToggle} action={menuOpen ? "close" : "menu"}>
        <DeleteImageModal
            imageToDelete={imageToDelete}
            onCancel={() => setImageToDelete()}
            onDelete={handleDelete}
        />
        <canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
        <Menu open={menuOpen} setOpen={setMenuOpen}>
            <div onClick={handleSendToProcess}>Procesar</div>
            <div onClick={handleSetCandidate}>Borrar</div>
        </Menu>
    </ViewBase>
}