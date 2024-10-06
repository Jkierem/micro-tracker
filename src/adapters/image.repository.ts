import { Context, Effect, Layer } from "effect";
import { IDBValue, CRUD, fromObjectStore, ReadAllError, ReadError } from "./indexed-db/crud";
import { IndexedDBAdapter } from "./indexed-db/index-db.adapter";
import { MicroTrackerV1 } from "./indexed-db/databases/micro-tracker-v1";
import { Schema } from "@effect/schema";

export const SupportedFileTypes = [
    "image/png",
    "image/apng",
    "image/avif",
    "image/gif",
    "image/svg",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/tiff",
] as const

export const FileType = Schema.Union(
    Schema.Literal("image/png"),
    Schema.Literal("image/apng"),
    Schema.Literal("image/avif"),
    Schema.Literal("image/gif"),
    Schema.Literal("image/svg"),
    Schema.Literal("image/jpeg"),
    Schema.Literal("image/jpg"),
    Schema.Literal("image/webp"),
    Schema.Literal("image/tiff"),
)

export const Dimensions = Schema.Struct({
    width: Schema.Int.pipe(Schema.positive()),
    height: Schema.Int.pipe(Schema.positive())
})

const Image = IDBValue(Schema.Struct({
    data: Schema.Uint8ArrayFromSelf,
    fileType: FileType,
    imageName: Schema.String,
    patientName: Schema.String,
    dimensions: Dimensions,
}))

export declare namespace ImageRepo {
    type Dimensions = Schema.Schema.Type<typeof Dimensions>;
    type FileType = Schema.Schema.Type<typeof FileType>;
    type Image = Schema.Schema.Type<typeof Image>;

    namespace Get.Single {
        type Success = Image;
        type Error = ReadError;
        type Dependency = { id: number }
    }

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

    static Utils = {
        getFilePath(file: ImageRepo.Image): string {
            const { imageName, fileType } = file;
            const ext = fileType.slice(fileType.indexOf("/") + 1);
            if( imageName.endsWith(`.${ext}`)){
                return imageName;
            }
            return `${imageName}.${ext}`;
        }
    }
}