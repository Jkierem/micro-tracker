import { Effect, Option } from "effect";
import { Modal } from "../modal/modal"
import { VideoService } from "../../services/video.service";
import { useState } from "react";
import { Input } from "../input/input";
import { Button } from "../button/button";
import { Services } from "../services-provider/services.provider";
import { ImageRepo } from "../../adapters/image.repository";

type FileInfo = {
    imageName?: string,
    patientName?: string,
}

type Props = {
    candidate: Option.Option<VideoService.Snapshot>
    onCancel: () => void;
    onAccept: (image: ImageRepo.Image) => void;
}

export const SaveSnapshotModal = (props: Props) => {
    const { images } = Services.use()

    const { candidate, onCancel, onAccept } = props;

    const [fileInfo, setFileInfo] = useState<FileInfo>({});

    const handleChangeFileInfo = (key: keyof FileInfo) => (next: string) => {
        setFileInfo(prev => ({ ...prev, [key]: next.length === 0 ? undefined : next}))
    }

    const handleSave = () => {
        Effect.gen(function*(_){
            const [data, dimensions] = yield* candidate;
            const { imageName: rawImageName, patientName } = fileInfo

            if( rawImageName && patientName ){
                let imageName = rawImageName.trim();
                if( !rawImageName.endsWith(".png") ){
                    imageName = `${imageName}.png`;
                }
    
                const image = yield* images.save({
                    data: new Uint8Array(data),
                    dimensions,
                    fileType: "image/png",
                    imageName,
                    patientName,
                })
    
                setFileInfo({})
                onAccept(image)
            }
        }).pipe(Effect.runPromise)
    }

    return <Modal
        open={Option.isSome(candidate)}
        onClose={onCancel}
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
                onClick={onCancel}
            >Cancel</Button.Secondary>
            <div style={{ width: "30px"}}></div>
            <Button.Primary 
                color="green"
                onClick={handleSave}
            >Guardar</Button.Primary>
        </div>
    </Modal>
}