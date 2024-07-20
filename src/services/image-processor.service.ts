import { Effect } from "effect";

export declare namespace ImageProcessor {
    type Result = unknown;
    type Shape = {
        process: () => Effect.Effect<Result>;
    }
}