import { Data } from "effect";

export class Ready
extends Data.TaggedClass("Ready")<{}> {}

type BoxDef = {
    x: number,
    y: number,
    w: number,
    h: number
}
type ModelResult = {
    parasite: BoxDef[]
}

export class Result
extends Data.TaggedClass("Result")<{ data: ModelResult }> {}

export class Error
extends Data.TaggedError("Error")<{ error: unknown }> {}

export type InitMessage = 
    | Ready
    | Error
