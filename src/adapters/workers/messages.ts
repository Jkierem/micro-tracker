import { Data } from "effect";
import { JobRepo } from "../job.repository";
import { ImageRepo } from "../image.repository";

export class Result
extends Data.TaggedClass("Result")<{ 
    image: Uint8Array, 
    detection: readonly Record<"x"|"y"|"w"|"h", number>[],
    jobId: number 
}> {}

export class Started
extends Data.TaggedClass("Started")<{ jobId: number }> {}

export class JobError
extends Data.TaggedClass("JobError")<{ jobId: number }> {}

export class Ready
extends Data.TaggedClass("Ready")<{}> {}

export class ScheduleJob
extends Data.TaggedClass("ScheduleJob")<{ jobId: number, image: ImageRepo.Image }> {}

export type PythonOutgoingMessage = 
    | Ready
    | Result
    | Started
    | JobError 

export type PythonIncomingMessage =
    | ScheduleJob

export class RequestJob 
extends Data.TaggedClass("RequestJob")<{ imageId: number }>{}

export class Sync
extends Data.TaggedClass("Sync")<{ data: JobRepo.EncodedJobs }>{}

export class RequestSync
extends Data.TaggedClass("RequestSync"){}

export class DeleteJob
extends Data.TaggedClass("DeleteJob")<{ jobId: number }>{}

export type QueueIncomingMessage = 
    | RequestJob
    | RequestSync
    | DeleteJob

export type QueueOutgoingMessage = 
    | Sync