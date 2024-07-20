import { Effect } from "effect"

export declare namespace Persistance {
    type ImageEntity = {
        name: string,
        data: ArrayBuffer
    }

    type Shape = {
        image: {
            save: (entity: ImageEntity) => Effect.Effect<void>;
            load: (name: string) => Effect.Effect<ImageEntity>;
            list: () => Effect.Effect<string[]>;
            delete: () => Effect.Effect<void>;
        },
        processing: {
            save: (entity: unknown) => Effect.Effect<void>;
            load: (name: string) => Effect.Effect<void>;
            list: () => Effect.Effect<string[]>;
            delete: () => Effect.Effect<void>;
        }
    }
}
