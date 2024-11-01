import { Effect, Option, pipe } from "effect";
import { JobRepo } from "../job.repository";
import { IDBKey } from "../indexed-db/indexed-db.support";
import { Sync } from "./messages";
import { ImageRepo } from "../image.repository";

export class JobQueueView {
    private jobs: Option.Option<JobRepo.Jobs>;
    private listener?: (self: JobQueueView) => void;
    constructor(){
        this.jobs = Option.none();
    }

    hasSynced(){
        return this.jobs._tag === "Some";
    }

    clone(){
        const next = new JobQueueView();
        next.jobs = this.jobs;
        next.listener = this.listener;
        return next;
    }

    sync(jobs: JobRepo.Jobs){
        this.jobs = Option.some(jobs);
        this.listener?.(this.clone());
    }

    getJobs(){
        return this.jobs;
    }

    delete(jobId: number){
        if( Option.isSome(this.jobs) ){
            this.jobs = Option.some(this.jobs.value.filter(job => job.id !== jobId));
            this.listener?.(this.clone());
        }
    }

    watch(listener: (self: JobQueueView) => void){
        this.listener = listener;
        return () => {
            this.listener = undefined;
        }
    }
}

export class JobQueue {
    private jobs: JobRepo.Job[];
    constructor(
        private repo: JobRepo.Shape
    ){
        this.jobs = []
    }

    public fetchJobs(){
        return pipe(
            this.repo.readAll(),
            Effect.andThen(jobs => { 
                this.jobs = jobs
            }),
            Effect.catchAllCause(e => Effect.logError(e)),
        )
    }

    private updateJob(jobId: number, update: (prev: JobRepo.Job) => JobRepo.Job){
        const jobIndex = this.jobs.findIndex(job => job.id === jobId);
        if( jobIndex >= 0 ){
            const updatedJob = update(this.jobs[jobIndex]);
            return this.repo.update(updatedJob)
                .pipe(
                    Effect.andThen(updated => { this.jobs[jobIndex] = updated }),
                    Effect.asVoid
                )
        }
        return Effect.void;
    }

    start(jobId: number){
        return this.updateJob(jobId, (prev) => ({
            ...prev,
            state: "running"
        }))
    }

    finish(jobId: number, result: number){
        return this.updateJob(jobId, (prev) => ({
            ...prev,
            state: "finished" as const,
            result: Option.some(IDBKey.fromNumber(result))
        }))
    }

    error(jobId: number){
        return this.updateJob(jobId, (prev) => ({
            ...prev,
            state: "error" as const,
            result: Option.none()
        }))
    }

    schedule(image: ImageRepo.Image){
        return Effect.gen(this, function*(_){
            const job = yield* this.repo.create({
                imageId: image.id,
                imageName: image.imageName,
                patientName: image.patientName,
                result: Option.none(),
                state: "waiting"
            })
            this.jobs.push(job);
        })
    }

    delete(jobId: number){
        this.jobs = this.jobs.filter(job => job.id !== jobId);
    }

    sync(){
        return JobRepo.encodeJobs(this.jobs).pipe(
            Effect.map(data => new Sync({ data }))
        );
    }

    check(): Option.Option<JobRepo.Job> {
        if( this.jobs.length === 0 ){
            return Option.none()
        }
        return Option.firstSomeOf([
            Option.fromNullable(this.jobs.find(job => job.state === "running")),
            Option.fromNullable(this.jobs.filter(job => job.state !== "finished" && job.state !== "error").sort((a,b) => a.id - b.id)[0])
        ])
    }
}