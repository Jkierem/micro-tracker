import { Data, Match, pipe } from "effect";

export class Waiting
extends Data.TaggedClass("Waiting") {}
export class Ready
extends Data.TaggedClass("Ready")<{ worker: Worker }> {}
export class Busy
extends Data.TaggedClass("Busy")<{ worker: Worker }> {}

export type QueueState = 
    | Waiting
    | Ready
    | Busy

export const free = (state: QueueState) => {
    return pipe(
        Match.value(state),
        Match.tag("Busy", ({ worker }) => new Ready({ worker })),
        Match.orElse(() => state)
    )
}

export const lock = (state: QueueState) => {
    return pipe(
        Match.value(state),
        Match.tag("Ready", ({ worker }) => new Busy({ worker })),
        Match.orElse(() => state)
    )
}

export const isReady = (state: QueueState): state is Ready => state._tag === "Ready" 
