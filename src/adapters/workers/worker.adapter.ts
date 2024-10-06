import { Effect, Data, Context, Layer, pipe, Ref, Option } from "effect"
import MessageQueue from "./message-queue?worker";
import { JobQueueView } from "./job-queue";
import { QueueOutgoingMessage, RequestJob, RequestSync } from "./messages";
import { useEffect, useState } from "react";
import { JobRepo } from "../job.repository";
import { Resource } from "../../support/effect";

export class WorkerNotReady
extends Data.TaggedError("WorkerNotReady") {}
export class JobRequested
extends Data.TaggedClass("JobRequested") {}
export class JobNotFound
extends Data.TaggedError("JobNotFound")<{ jobId: number }>{}

export declare namespace WorkerAdapter {
    type Shape = {
        sync(): void;
        schedule(imageId: number): Effect.Effect<JobRequested, WorkerNotReady>;
        useQueueView: () => [JobQueueView]
        useJobView: (jobId: JobRepo.JobId) => [Resource.Resource<
            JobRepo.Job,
            JobNotFound
        >]
    }
}

export class WorkerAdapter
extends Context.Tag("WorkerAdapter")<
    WorkerAdapter,
    WorkerAdapter.Shape
>(){
    static Live = Layer.effect(WorkerAdapter, Effect.gen(function*(_){
        const queue = yield* Ref.make(new JobQueueView());

        const worker = new MessageQueue();

        worker.onmessage = (e: MessageEvent<QueueOutgoingMessage>) => {
            switch(e.data._tag){
                case "Sync":
                    pipe(
                        queue,
                        Ref.update((prev) => {
                            const data = JobRepo.decodeJobs(e.data.data).pipe(Effect.runSync);
                            prev.sync(data);
                            return prev;
                        }),
                        Effect.runSync
                    )
                    break;
            }
        }

        return WorkerAdapter.of({
            sync(){
                worker.postMessage(new RequestSync())
            },
            schedule(imageId){
                return Effect.gen(function*(_){
                    const q = yield* queue.get;
                    if( !q.hasSynced() ){
                        return yield* new WorkerNotReady();
                    }
                    worker.postMessage(new RequestJob({ imageId }))
                    return new JobRequested();
                })
            },
            useJobView(jobId) {
                const [queue] = this.useQueueView();

                return [pipe(
                    queue.getJobs(),
                    Option.map(jobs => {
                        const job = jobs.find(job => job.id === jobId);
                        if( job ){
                            return Resource.Success(job);
                        } else {
                            return Resource.Error(new JobNotFound({ jobId }));
                        }
                    }),
                    Option.getOrElse(() => Resource.Loading())
                )]
            },
            useQueueView() {
                const [jobQueue, setQueue] = useState<JobQueueView>(() => queue.get.pipe(Effect.runSync))
                useEffect(() => {
                    return jobQueue.watch(setQueue)
                },[]);

                return [jobQueue];
            },
        })
    }))
}