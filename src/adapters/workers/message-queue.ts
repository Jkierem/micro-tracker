import { Data, Effect, pipe } from "effect";
import { WorkerAdapter } from "./worker.adapter";
import { ImageRepo } from "../image.repository";
import { IndexedDBAdapter } from "../indexed-db/index-db.adapter";
import { DOMAdapter } from "../dom.adapter";
import { Result } from "./messages";
import { IDBKey } from "../indexed-db/indexed-db.support";
import { Queue } from "../../support/effect/worker-queue";

export class ScheduleJob
extends Data.TaggedClass("ScheduleJob")<{ imageId: number }> {}
export class JobResult
extends Data.TaggedClass("JobResult")<{ 
    result: unknown
}> {}

type QueueMessages = 
    | ScheduleJob
    | JobResult

const Jobs = Queue.make<Result>((e) => {
    self.postMessage(e.data);
})

const { Workers, Images } = Effect.gen(function*(){
    const Workers = yield* WorkerAdapter;
    const Images = yield* ImageRepo;

    return {
        Workers,
        Images,
    }
}).pipe(
    Effect.provide(WorkerAdapter.Live),
    Effect.provide(ImageRepo.Live),
    Effect.provide(IndexedDBAdapter.Live),
    Effect.provide(DOMAdapter.Live)
).pipe(Effect.runSync)

Effect.gen(function*(_){
    const worker = yield* Workers.instantiateAndWait("PythonRunner");
    Jobs.bind(worker);
}).pipe(Effect.runPromise)

type MessageData = {
    imageId: number
};

self.onmessage = async (e: MessageEvent<MessageData>) => {
    const image = await pipe(
        Images.read(IDBKey.fromNumber(e.data.imageId)),
        Effect.runPromise
    )

    Jobs.enqueue({ image });
}

