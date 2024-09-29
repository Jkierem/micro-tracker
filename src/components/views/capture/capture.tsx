import React, { useRef } from "react";
import { IconButton } from "../../icon-button/icon-button"
import { Services } from "../../services-provider/services.provider"
import { ViewBase } from "../../view-base/view-base"
import { SupportedFileTypes } from "../../../adapters/image.repository";

export const Capture = () => {
    const { router } = Services.use();
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
        console.log(e.target.files)
    }

    return <ViewBase>
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