import { ViewBase } from "../../view-base/view-base"
import { IconButton } from "../../icon-button/icon-button"
import { Services } from "../../services-provider/services.provider"

export const Main = () => {
    const { router } = Services.use();

    const handleCamera = () => {
        router.goToCapture();
    }

    const handleGallery = () => {
        router.goToGallery();
    }

    const handleReports = () => {
        router.goToReports();
    }

    return <ViewBase>
        <IconButton.Group>
            <IconButton text="Captura" icon="camera" onClick={handleCamera}/>
            <IconButton text="Galeria" icon="gallery" onClick={handleGallery}/>
            <IconButton text="Reportes" icon="reports" onClick={handleReports}/>
        </IconButton.Group>
    </ViewBase>
}