import React, { useRef, useState } from "react";
import { IconButton } from "../../icon-button/icon-button"
import { Services } from "../../services-provider/services.provider"
import { ViewBase } from "../../view-base/view-base"
import { SupportedFileTypes } from "../../../adapters/image.repository";
import { Modal } from "../../modal/modal";
import { Effect } from "effect";
import { Button } from "../../button/button";
import { VisualizerDataTypes } from "../../../support/routing/views";

export const Capture = () => {
    const { router, loader } = Services.use();
    const [error, setError] = useState<string | undefined>()

    const handleCamera = () => {
        router.goToCamera();
    }

    const fileRef = useRef<HTMLInputElement>(null);

    const triggerUpload = () => {
        if( fileRef.current ){
            fileRef.current.click();
        }
    }

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if( e.target.files?.[0] ){
            loader.verifyFile(e.target.files[0]).pipe(
                Effect.flatMap(file => {
                    return router.goToVisualizerEffect({ data: VisualizerDataTypes.File({ file }) })
                }),
                Effect.catchTag("UnsupportedFileError", (e) => {
                    setError(`Archivos ${e.fileType} no son soportados`);
                    return Effect.void;
                }),
                Effect.catchTag("RequestError", () => {
                    setError("Error al pedir archivo");
                    return Effect.void;
                }),
                Effect.catchTag("ProcessingError", () => {
                    setError("Error procesando archivo")
                    return Effect.void;
                }),
                Effect.runPromise
            )
        }
    }

    return <ViewBase>
        <Modal open={Boolean(error)}>
            <h1>{error}</h1>
            <Button.Primary color="red" onClick={() => setError(undefined)}>
                Aceptar
            </Button.Primary>
        </Modal>
        <IconButton.Group>
            <IconButton icon="camera" text="Camara" onClick={handleCamera} />
            <IconButton icon="upload" text="Subir Archivo" onClick={triggerUpload} />
        </IconButton.Group>
        <input 
            type="file" 
            style={{ display: "none" }} 
            multiple={false} 
            ref={fileRef} 
            onChange={handleFile}
            accept={SupportedFileTypes.join(",")}
        />
    </ViewBase>
}