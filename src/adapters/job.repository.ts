import { Context, Effect, Layer } from "effect";
import { IDBValue, CRUD, fromObjectStore, ReadAllError, IDBKeySchema } from "./indexed-db/crud";
import { IndexedDBAdapter } from "./indexed-db/index-db.adapter";
import { MicroTrackerV1 } from "./indexed-db/databases/micro-tracker-v1";
import { Schema } from "@effect/schema";

export const JobState = Schema.Union(
    Schema.Literal("waiting"),
    Schema.Literal("running"),
    Schema.Literal("finished"),
    Schema.Literal("error"),
)

export const ModelResult = Schema.Uint8ArrayFromSelf

const Job = IDBValue(Schema.Struct({
    state: JobState,
    imageId: IDBKeySchema,
    result: Schema.Option(ModelResult),
}))

const Jobs = Schema.Array(Job);

export declare namespace JobRepo {
    type JobState = Schema.Schema.Type<typeof JobState>;
    type ModelResult = Schema.Schema.Type<typeof ModelResult>;
    type Job = Schema.Schema.Type<typeof Job>;
    type Jobs = Schema.Schema.Type<typeof Jobs>;
    type EncodedJobs = Schema.Schema.Encoded<typeof Jobs>;
    type JobId = Job['id'];

    namespace Get.All {
        type Success = Job[];
        type Error = ReadAllError;
    }

    type Shape = CRUD<Job>
}

export class JobRepo
extends Context.Tag("ImageRepo")<
    JobRepo,
    JobRepo.Shape
>() {
    static encodeJobs = Schema.encode(Jobs);
    static decodeJobs = Schema.decode(Jobs);

    static Live = Layer.effect(JobRepo, Effect.gen(function*(_){
        const idb = yield* _(IndexedDBAdapter);

        const jobStore = _(
            idb.connect(MicroTrackerV1),
            Effect.map(db => db.access("jobs"))
        );

        return JobRepo.of(fromObjectStore(jobStore, Job))
    }))
}