import { Services } from "../services-provider/services.provider"
import { Match, pipe } from "effect"
import { Main } from "../views/main/main";
import { Capture } from "../views/capture/capture";
import { NotFound } from "../views/not-found/not-found";
import { Camera } from "../views/camera/camera";
import { Gallery } from "../gallery/gallery";

export const ViewManager = () => {
    const { router } = Services.use();

    const currentView = router.useCurrentView();

    return <>
        {pipe(
            Match.value(currentView),
            Match.tag("Main", () => <Main />),
            Match.tag("Capture", () => <Capture />),
            Match.tag("Camera", () => <Camera />),
            Match.tag("Gallery", () => <Gallery />),
            Match.orElse(() => <NotFound />)
        )}
    </>
}