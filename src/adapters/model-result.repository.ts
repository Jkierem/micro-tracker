import { Context, Effect, Layer } from "effect";
import { IDBValue, CRUD, fromObjectStore, IDBKeySchema, ReadError } from "./indexed-db/crud";
import { IndexedDBAdapter } from "./indexed-db/index-db.adapter";
import { MicroTrackerV1 } from "./indexed-db/databases/micro-tracker-v1";
import { Schema } from "@effect/schema";

export const DetectionData = Schema.Array(Schema.Struct({
    x: Schema.Number,
    y: Schema.Number,
    w: Schema.Number,
    h: Schema.Number,
}))

const ModelResult = IDBValue(Schema.Struct({
    jobId: IDBKeySchema,
    detection: DetectionData,
    image: Schema.Uint8ArrayFromSelf,
}))

export declare namespace ModelResultRepo {
    type ModelResult = Schema.Schema.Type<typeof ModelResult>;
    namespace Get.Single {
        type Success = ModelResult;
        type Error = ReadError;
        type Dependency = { id: number }
    }

    type Shape = CRUD<ModelResult>
}

export class ModelResultRepo
extends Context.Tag("ModelResultRepo")<
    ModelResultRepo,
    ModelResultRepo.Shape
>() {
    static Live = Layer.effect(ModelResultRepo, Effect.gen(function*(_){
        const idb = yield* _(IndexedDBAdapter);

        const resultStore = _(
            idb.connect(MicroTrackerV1),
            Effect.map(db => db.access("results"))
        );

        return ModelResultRepo.of(fromObjectStore(resultStore, ModelResult))
    }))
}