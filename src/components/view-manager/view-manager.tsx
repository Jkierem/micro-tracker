import ImageViewer from "../image-viewer";
import { MainMenu } from "../main-menu/main-menu";
import { Services } from "../services-provider/services.provider"
import { Effect, Match, pipe } from "effect"

export const ViewManager = () => {
    const { router } = Services.use();

    const currentView = router.useCurrentView();

    return <div>
        {pipe(
            Match.value(currentView),
            Match.tag("ImageViewer", () => <ImageViewer />),
            Match.tag("MainMenu", () => <MainMenu />),
            Match.orElse(() => <button onClick={() => router.goBack().pipe(Effect.runSync)}>Go Back</button>)
        )}
    </div>
}