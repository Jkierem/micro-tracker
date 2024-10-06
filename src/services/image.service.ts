import { Context, Effect, Layer } from "effect";
import { ImageRepo } from "../adapters/image.repository";
import { FreeResourceHook, makeFreeResourceHook, makeResourceHook, ResourceHook } from "../support/effect/resource";
import { IDBKey } from "../adapters/indexed-db/indexed-db.support";

export declare namespace ImageService {
    type Shape = {
        save: ImageRepo.Shape['create'];
        update: ImageRepo.Shape['update'];
        delete: ImageRepo.Shape['delete'];
        useImage: ResourceHook<
            ImageRepo.Get.Single.Success,
            ImageRepo.Get.Single.Error,
            ImageRepo.Get.Single.Dependency
        >;
        useAll: FreeResourceHook<
            ImageRepo.Get.All.Success,
            ImageRepo.Get.All.Error
        >
    };
}

export class ImageService
extends Context.Tag("ImageService")<
    ImageService,
    ImageService.Shape
>() {
    static Live = Layer.effect(ImageService, Effect.gen(function*(_){
        const repo = yield* _(ImageRepo);

        return ImageService.of({
            save: repo.create,
            update: repo.update,
            delete: repo.delete,
            useImage: makeResourceHook(({ id }) => repo.read(IDBKey.fromNumber(id))),
            useAll: makeFreeResourceHook(() => repo.readAll()),
        })
    }))
}