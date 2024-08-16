import { Context, Effect, Layer } from "effect";
import { IDBValue, CRUD, fromObjectStore, ReadAllError } from "./indexed-db/crud";
import { IndexedDBAdapter } from "./indexed-db/index-db.adapter";
import { MicroTrackerV1 } from "./indexed-db/databases/micro-tracker-v1";
import { Schema } from "@effect/schema";

const Image = IDBValue(Schema.Struct({
    data: Schema.Uint8ArrayFromSelf,
    imageName: Schema.String,
    patientName: Schema.String,
}))

export declare namespace ImageRepo {
    type Image = Schema.Schema.Type<typeof Image>;

    namespace Get.All {
        type Success = Image[];
        type Error = ReadAllError;
    }

    type Shape = CRUD<Image>;
}

export class ImageRepo
extends Context.Tag("ImageRepo")<
    ImageRepo,
    ImageRepo.Shape
>() {
    static Live = Layer.effect(ImageRepo, Effect.gen(function*(_){
        const idb = yield* _(IndexedDBAdapter);

        const imageStore = _(
            idb.connect(MicroTrackerV1),
            Effect.map(db => db.access("images"))
        );

        return ImageRepo.of(fromObjectStore(imageStore, Image))
    }))
}