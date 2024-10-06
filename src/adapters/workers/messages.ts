import { Data } from "effect";
import { JobRepo } from "../job.repository";
import { ImageRepo } from "../image.repository";

export type BoxDef = {
    x: number,
    y: number,
    w: number,
    h: number
}

export type ModelResult = {
    parasite: BoxDef[]
}

export class Result
extends Data.TaggedClass("Result")<{ data: ModelResult, jobId: number }> {}

export class Started
extends Data.TaggedClass("Started")<{ jobId: number }> {}

export class Error
extends Data.TaggedError("Error")<{ jobId: number }> {}

export class Ready
extends Data.TaggedClass("Ready")<{}> {}

export class ScheduleJob
extends Data.TaggedClass("ScheduleJob")<{ jobId: number, image: ImageRepo.Image }> {}

export type PythonOutgoingMessage = 
    | Ready
    | Result
    | Started
    | Error 

export type PythonIncomingMessage =
    | ScheduleJob

export class RequestJob 
extends Data.TaggedClass("RequestJob")<{ imageId: number }>{}

export class Sync
extends Data.TaggedClass("Sync")<{ data: JobRepo.Job[] }>{}

export class RequestSync
extends Data.TaggedClass("RequestSync"){}

export type QueueIncomingMessage = 
    | RequestJob
    | RequestSync

export type QueueOutgoingMessage = 
    | Sync