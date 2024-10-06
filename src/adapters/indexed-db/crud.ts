import { Data, Effect, pipe } from "effect";
import { IDBKey, IndexedDBError, ObjectStore } from "./indexed-db.support";
import { ParseResult, Schema } from "@effect/schema";

export class NotFoundError 
extends Data.TaggedError("NotFoundError")<{ id: IDBKey }>{}
export class DeleteError 
extends Data.TaggedError("DeleteError")<{ id: IDBKey }>{}

export type UpdateError = IndexedDBError | ParseResult.ParseError;

export type CreateError = IndexedDBError | ParseResult.ParseError;

export const IDBKeySchema = Schema.Number.pipe(Schema.fromBrand(IDBKey.fromNumber))

const ComputedAtrubutes = Schema.Struct({
    id: IDBKeySchema,
    createdAt: Schema.Date,
    updatedAt: Schema.Date,
})

export type ComputedAtrubutes = Schema.Schema.Type<typeof ComputedAtrubutes>;

export const IDBValue = <
    Fields extends Schema.Struct.Fields,
>(struct: Schema.Struct<Fields>) => {
    return Schema.Struct({
        ...struct.fields,
        ...ComputedAtrubutes.fields
    })
}

export type IDBValue<T> = ComputedAtrubutes & T;

export type CreatePayload<T extends IDBValue<any>> = Omit<T, keyof ComputedAtrubutes>;

export type ReadError = NotFoundError | ParseResult.ParseError

export type ReadAllError = IndexedDBError | ParseResult.ParseError

export type CRUD<Data extends IDBValue<any>> = {
    create: (data: CreatePayload<Data>) => Effect.Effect<Data, CreateError>;
    read: (id: IDBKey) => Effect.Effect<Data, ReadError>;
    update: (data: Data) => Effect.Effect<Data, UpdateError>;
    delete: (id: IDBKey) => Effect.Effect<void, DeleteError>;
    readAll: () => Effect.Effect<Data[], ReadAllError>;
}

export const fromObjectStore = <
    Data extends IDBValue<T>,
    T,
    Encoded extends Record<keyof Data, any>
>(
    store: Effect.Effect<ObjectStore<any>, IndexedDBError>,
    schema: Schema.Schema<Data, Encoded>,
): CRUD<Data> => {
    return {
        create(data: CreatePayload<Data>) {
            return store.pipe(
                Effect.flatMap(store => {
                    const created = new Date();
                    const raw = { 
                        ...data,
                        createdAt: created,
                        updatedAt: created, 
                    } as Omit<Data, "id">;
                    return pipe(
                        Schema.encode(
                            schema.pipe(Schema.omit("id"))
                        )(raw),
                        Effect.flatMap(data => store.add(data)),
                    )
                }),
                Effect.map(([id, stored]) => {
                    return Schema.decodeUnknownSync(schema)({ ...stored, id })
                }),
            )
        },
        delete(id) {
            return store.pipe(
                Effect.flatMap(store => store.delete(id)),
                Effect.mapError(() => new DeleteError({ id }))
            )
        },
        read(id) {
            return store.pipe(
                Effect.flatMap(store => store.get(id)),
                Effect.flatMap(data => Schema.decodeUnknown(schema)(data)),
                Effect.catchTag("IndexedDBError", () => new NotFoundError({ id }))
            )
        },
        readAll() {
            return store.pipe(
                Effect.flatMap(store => store.getAll()),
                Effect.flatMap(data => Effect.all(data.map(d => Schema.decodeUnknown(schema)(d))))
            )
        },
        update(data) {
            return pipe(
                ({...data, updatedAt: new Date }),
                Schema.encode(schema),
                Effect.bindTo("data"),
                Effect.bind("store", () => store),
                Effect.flatMap(({ data, store }) => {
                    return store.put(data);
                }),
                Effect.flatMap(([, data]) => Schema.decode(schema)(data))
            )
        },
    }
}