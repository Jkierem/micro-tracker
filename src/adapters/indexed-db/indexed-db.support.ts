import { Effect, Brand, Data } from "effect";

export class IndexedDBError 
extends Data.TaggedError("IndexedDBError")<{ error: unknown }> {
    static natural<T extends { new(args: { error: unknown }): any }>(Class: T){
        return (input: IndexedDBError) => {
            return new Class({ error: input.error }) as InstanceType<T>;
        }
    }
}

export type Version = number & Brand.Brand<"Version">;
export const Version = Brand.refined<Version>(
    (n) => n > 0 && Number.isInteger(n),
    (n) => Brand.error(`Expected ${n} to be a positive integer`)
);

export type DbName = string & Brand.Brand<"DbName">;
export const DbName = Brand.refined<DbName>(
    (n) => n.length > 0,
    () => Brand.error("Expected databse name to be a non-empty string")
)

export type ObjectStoreName = string & Brand.Brand<"ObjectStoreName">;
export const ObjectStoreName = Brand.refined<ObjectStoreName>(
    (n) => n.length > 0,
    () => Brand.error("Expected object store name to be a non-empty string")
)

export type StoreIndexName = string & Brand.Brand<"StoreIndexName">;
export const StoreIndexName = Brand.refined<StoreIndexName>(
    (n) => n.length > 0,
    () => Brand.error("Expected store index name to be a non-empty string")
)

export type IDBKey = number & Brand.Brand<"IDBKey">;
export const IDBKey = {
    fromNumber: Brand.nominal<IDBKey>(),
    fromValidKey: (key: IDBValidKey) => {
        return IDBKey.fromNumber(key as number);
    }
}

export type StoreDef<
    Indexes extends readonly string[],
> = {
    autoIncrement?: boolean,
    keyPath: string,
    indexes?: Indexes,
}

const fromIDBRequest = <A>(fn: () => IDBRequest<A>) => {
    return Effect.tryPromise({
        try() {
            return new Promise<A>((res, rej) => {
                const request = fn();

                request.onsuccess = () => res(request.result);

                request.onerror = () => rej(request.error);
            })
        },
        catch(error){
            return new IndexedDBError({ error });
        }
    })
} 

class StoreIndex {
    constructor(
        private indexKey: string,
        private db: IDBDatabase,
        private storeName: string
    ){}

    get(key: string): Effect.Effect<unknown, IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readonly")
            .objectStore(this.storeName)
            .index(this.indexKey)
            .get(key)
        )
    }
    getAll(): Effect.Effect<unknown[], IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readonly")
            .objectStore(this.storeName)
            .index(this.indexKey)
            .getAll()
        )
    }
}

export class ObjectStore<const Indexes extends string[]> {
    constructor(
        private db: IDBDatabase,
        readonly storeName: string,
        readonly keyPath: string,
        readonly indexes: Indexes
    ){}

    index<T extends Indexes[number]>(indexKey: T) {
        return new StoreIndex(indexKey, this.db, this.storeName);
    }

    add<A>(data: A): Effect.Effect<[IDBKey, A], IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readwrite")
            .objectStore(this.storeName)
            .add(data)
        ).pipe(Effect.map((key) => [IDBKey.fromValidKey(key), data]))
    }

    delete(key: IDBKey): Effect.Effect<void, IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readwrite")
            .objectStore(this.storeName)
            .delete(key)
        )
    }

    get(key: IDBKey): Effect.Effect<unknown, IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readonly")
            .objectStore(this.storeName)
            .get(key)
        )
    }

    getAll(): Effect.Effect<unknown[], IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readonly")
            .objectStore(this.storeName)
            .getAll()
        )
    }

    put<A>(data: A): Effect.Effect<[IDBKey, A], IndexedDBError> {
        return fromIDBRequest(() => this.db
            .transaction(this.storeName, "readwrite")
            .objectStore(this.storeName)
            .put(data)
        ).pipe(Effect.map((key) => [IDBKey.fromValidKey(key), data]))
    }
}

export class IDBConnector<const T extends Record<string, StoreDef<any>>> {
    constructor(
        private db: IDBDatabase,
        private def: T
    ){}

    access<Key extends keyof T & string>(key: Key): ObjectStore<T[Key]['indexes']> {
        return new ObjectStore(
            this.db, 
            key,
            this.def[key].keyPath,
            this.def[key].indexes ?? []
        );
    }
}

export class IndexedDB<const T extends Record<string, StoreDef<any>>> {
    constructor(
        readonly name: DbName,
        readonly version: Version,
        private def: T
    ){}

    static make<const T extends Record<string, StoreDef<any>>>(
        name: DbName,
        version: Version,
        def: T
    ){
        return new IndexedDB(name, version, def)
    }

    connect(db: IDBDatabase): IDBConnector<T> {
        return new IDBConnector(db, this.def);
    }

    up(db: IDBDatabase){
        Object.entries(this.def).forEach(
            ([storeName, { indexes, autoIncrement, keyPath }]: [string, StoreDef<string[]>]) => {
            const self = db.createObjectStore(storeName, {
                keyPath,
                autoIncrement,
            });
            indexes?.forEach(index => {
                self.createIndex(index, index, { multiEntry: true });
            })
        })
    }

    down(db: IDBDatabase) {
        Object.keys(this.def).forEach(key => db.deleteObjectStore(key));
    }
}
