import { Context, Layer } from "effect";

export declare namespace IndexedDBAdapter {
    type Shape = {

    }
}

export class IndexedDBAdapter extends Context.Tag("@adapters/indexed-db")<
    IndexedDBAdapter,
    IndexedDBAdapter.Shape
>() {
    static Live = Layer.succeed(IndexedDBAdapter, IndexedDBAdapter.of({}))
}