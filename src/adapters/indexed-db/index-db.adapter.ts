import { Context, Effect, Layer, HashMap, Option, Ref, pipe, Data } from "effect";
import { DOMAdapter } from "../dom.adapter";
import { IndexedDBError, IndexedDB, StoreDef, IDBConnector, DbName, Version } from "./indexed-db.support";

export declare namespace IndexedDBAdapter {
    type Shape = {
        connect: <T extends Record<string, StoreDef<any>>>(
            def: IndexedDB<T>
        ) => Effect.Effect<IDBConnector<T>, IndexedDBError>
    }
}

class IDBIdentity
extends Data.Class<{ name: DbName, version: Version }> {
    static fromIDB({ name, version }: IndexedDB<any>){
        return new IDBIdentity({ name, version })
    }
}

export class IndexedDBAdapter extends Context.Tag("@adapters/indexed-db")<
    IndexedDBAdapter,
    IndexedDBAdapter.Shape
>() {
    static Live = Layer.effect(IndexedDBAdapter, Effect.gen(function* (_){
        const global = yield* DOMAdapter.Global

        const IDBInstanceMap = yield* _(
            Ref.make(HashMap.empty<IDBIdentity, IDBDatabase>()),
            Effect.map(ref => {
                return {
                    get(id: IDBIdentity){
                        return pipe(
                            Ref.get(ref),
                            Effect.map(map => HashMap.get(id)(map))
                        )
                    },
                    set(id: IDBIdentity, instance: IDBDatabase){
                        return pipe(
                            ref,
                            Ref.update(hm => HashMap.set(id, instance)(hm))
                        )
                    }
                }
            })
        )

        return IndexedDBAdapter.of({
            connect(idb) {
                return Effect.gen(function*(_){
                    const identity = IDBIdentity.fromIDB(idb)
                    const instance = yield* _(IDBInstanceMap.get(identity));
                    if( Option.isSome(instance) ){
                        return idb.connect(instance.value);
                    }
        
                    const requestDB = () => {
                        return new Promise<IDBDatabase>((resolve, reject) => {
                            const request = global.indexedDB.open(idb.name, idb.version);
        
                            request.onupgradeneeded = (e: any) => {
                                idb.up(e.target.result)
                            }
        
                            request.onerror = () => {
                                reject(request.error);
                            }
        
                            request.onsuccess = () => {
                                resolve(request.result);
                            }
                        })
                    }
        
                    const openDB = Effect.tryPromise({
                        try: () => requestDB(),
                        catch(error) {
                            return new IndexedDBError({ error });
                        },
                    })
        
                    const db = yield* _(openDB);
        
                    return yield* _(
                        IDBInstanceMap.set(identity, db),
                        Effect.map(() => idb.connect(db))
                    )
                })
            },
        })
    }))
}