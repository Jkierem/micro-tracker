import { CommonVisualizer } from "./common-visualizer";
import { VisualizerData } from "../../../support/routing/views";
import { Match, pipe } from "effect";
import { FileVisualizer } from "./file-visualizer";

export const Visualizer = ({ data }: { data: VisualizerData }) => {
    return pipe(
        Match.value(data),
        Match.tag("File", ({ file }) => <FileVisualizer file={file} />),
        Match.tag("Image", ({ image }) => <CommonVisualizer image={image} />),
        Match.exhaustive
    )
}