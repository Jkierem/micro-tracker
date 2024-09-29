import { Effect, Data, Context, Layer, pipe } from "effect"
import MessageQueue from "./message-queue?worker";
import PythonRunner from "./python-runnner?worker";

export class WorkerError
extends Data.TaggedError("WorkerError")<{ error: unknown }> {}

export declare namespace WorkerAdapter {
    type AvailableWorker = 
        | "MessageQueue"
        | "PythonRunner"

    type Shape = {
        instantiate: (worker: AvailableWorker) => Effect.Effect<Worker, WorkerError>;
        instantiateAndWait: (worker: AvailableWorker) => Effect.Effect<Worker, WorkerError>;
    }
}

export class WorkerAdapter
extends Context.Tag("WorkerAdapter")<
    WorkerAdapter,
    WorkerAdapter.Shape
>(){
    static waitForWorker = (worker: Worker) => {
        return Effect.async<void, unknown>((resume) => {
            worker.onmessage = (e: MessageEvent<{ _tag: "Ready" | "Error" }>) => {
                switch(e.data._tag){
                    case "Ready":
                        resume(Effect.void)
                        break;
                    case "Error":
                        resume(Effect.fail(e.data))
                        break;
                }
            }
        })
    }
    static Live = Layer.effect(WorkerAdapter, Effect.gen(function*(_){
        return WorkerAdapter.of({
            instantiate(worker) {
                return Effect.try({
                    try: () => {
                        switch(worker){
                            case "MessageQueue":
                                return new MessageQueue();
                            case "PythonRunner":
                                return new PythonRunner();
                        }
                    },
                    catch(error) {
                        return new WorkerError({ error })
                    },
                })
            },
            instantiateAndWait(workerName) {
                return Effect.gen(this, function* (){
                    const worker = yield* this.instantiate(workerName);
                    yield* pipe(Effect.async<void, unknown>((resume) => {
                        worker.onmessage = (e: MessageEvent<{ _tag: "Ready" | "Error" }>) => {
                            switch(e.data._tag){
                                case "Ready":
                                    resume(Effect.void)
                                    break;
                                case "Error":
                                    resume(Effect.fail(e.data))
                                    break;
                            }
                        }
                    }), Effect.orDie)
                    return worker;
                })
            },
        })
    }))
}