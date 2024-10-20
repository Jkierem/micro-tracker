import { Services } from "../services-provider/services.provider"
import { Match, pipe } from "effect"
import { Main } from "../views/main/main";
import { Capture } from "../views/capture/capture";
import { NotFound } from "../views/not-found/not-found";
import { Camera } from "../views/camera/camera";
import { Gallery } from "../views/gallery/gallery";
import { Visualizer } from "../views/visualizer/visualizer";
import { Jobs } from "../views/jobs/jobs";
import { Job } from "../views/job/job";

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
            Match.tag("Visualizer", ({ data }) => <Visualizer data={data} />),
            Match.tag("Reports", () => <Jobs />),
            Match.tag("Report", ({ data }) => <Job jobId={data} />),
            Match.orElse(() => <NotFound />)
        )}
    </>
}