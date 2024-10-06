import { Data, Effect, Option, pipe } from "effect"
import { PythonOutgoingMessage, QueueIncomingMessage, Result, ScheduleJob } from "./messages"
import { JobRepo } from "../job.repository"
import { IndexedDBAdapter } from "../indexed-db/index-db.adapter";
import { DOMAdapter } from "../dom.adapter";
import { IDBKey } from "../indexed-db/indexed-db.support";
import PythonRunner from "./python-runnner?worker";
import { ImageRepo } from "../image.repository";
import { JobQueue } from "./job-queue";
import { ModelResultRepo } from "../model-result.repository";

export class Waiting
extends Data.TaggedClass("Waiting") {}
export class Ready
extends Data.TaggedClass("Ready") {}
export class Busy
extends Data.TaggedClass("Busy")<{ jobId: number }> {}
type WorkerState = Waiting | Ready | Busy;

class WorkerTracker {
    private static _instance: WorkerTracker;

    private state: WorkerState;

    public static get instance(){
        if( !this._instance ){
            this._instance = new WorkerTracker();
        }
        return this._instance;
    }

    private constructor(){
        this.state = new Waiting();
    }

    public static isReady(){
        return this.instance.state._tag === "Ready";
    }

    public static ready(){
        this.instance.state = new Ready();
    }

    public static free(){
        if( this.instance.state._tag === "Busy" ){
            this.instance.state = new Ready();
        }
    }

    public static lock(jobId: number){
        if( this.instance.state._tag === "Ready" ){
            this.instance.state = new Busy({ jobId });
        }
    }
}

const [jobRepo, imageRepo, modelResultRepo] = await pipe(
    Effect.all([
        JobRepo,
        ImageRepo,
        ModelResultRepo,
    ]),
    Effect.provide(ModelResultRepo.Live),
    Effect.provide(JobRepo.Live),
    Effect.provide(ImageRepo.Live),
    Effect.provide(IndexedDBAdapter.Live),
    Effect.provide(DOMAdapter.Live),
    Effect.runPromise
)

const pythonWorker = new PythonRunner();

const queue = new JobQueue(jobRepo);

await queue.fetchJobs().pipe(Effect.runPromise);

const checkQueue = () => {
    return Effect.gen(function*(_){
        const nextInQueue = queue.check();
        if( Option.isSome(nextInQueue) && WorkerTracker.isReady()){
            const image = yield* imageRepo.read(IDBKey.fromNumber(nextInQueue.value.imageId));
            pythonWorker.postMessage(new ScheduleJob({
                image,
                jobId: nextInQueue.value.id,
            }), [image.data.buffer])
        }
        self.postMessage(queue.sync().pipe(Effect.runSync));
    })
}

const onPythonReady = () => Effect.gen(function*(){
    WorkerTracker.ready();
    yield* checkQueue();
})

const onFinishJob = ({ jobId, image, detection }: Result) => Effect.gen(function*(){
    const modelResult = yield* modelResultRepo.create({
        detection,
        image,
        jobId: IDBKey.fromNumber(jobId),
    })
    yield* queue.finish(jobId, modelResult.id);
    WorkerTracker.free();
    yield* checkQueue()
})

const onStartJob = (jobId: number) => Effect.gen(function*(){
    yield* queue.start(jobId);
    WorkerTracker.lock(jobId);
    self.postMessage(queue.sync().pipe(Effect.runSync));
})

const onRequestJob = (imageId: number) => Effect.gen(function*(_){
    const image = yield* imageRepo.read(IDBKey.fromNumber(imageId));
    yield* queue.schedule(image)
    yield* checkQueue()
})

const onFailedJob = (jobId: number) => Effect.gen(function*(_){
    yield* queue.error(jobId)
    WorkerTracker.free();
    yield* checkQueue()
})

const PythonMessageSink = async (e: MessageEvent<PythonOutgoingMessage>) => {
    switch(e.data._tag){
        case "Ready":
            await onPythonReady().pipe(Effect.runPromise);
            break;
        case "Result":
            const res = e.data;
            await onFinishJob(res).pipe(
                Effect.catchAll(() => onFailedJob(res.jobId)),
                Effect.runPromise
            );
            break;
        case "Started":
            await onStartJob(e.data.jobId).pipe(Effect.runPromise)
            break;
        case "JobError":
            await onFailedJob(e.data.jobId).pipe(Effect.runPromise)
            break;
    }
}

pythonWorker.addEventListener("message", PythonMessageSink);

const MessageQueueSink = async (e: MessageEvent<QueueIncomingMessage>) => {
    switch(e.data._tag){
        case "RequestJob":
            await onRequestJob(e.data.imageId).pipe(Effect.runPromise);
            break;
        case "RequestSync":
            self.postMessage(queue.sync().pipe(Effect.runSync));
            break;
        case "DeleteJob":
            queue.delete(e.data.jobId);
            self.postMessage(queue.sync().pipe(Effect.runSync));
            break;
    }
}

self.addEventListener("message", MessageQueueSink);

self.postMessage(queue.sync().pipe(Effect.runSync));