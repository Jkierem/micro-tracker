import { Effect, Option } from "effect";
import { Store } from "../../adapters/store.adapter";
import { Lens, ReadonlyLens, ReadonlyPrism } from "../optics";

export declare namespace Reader {
    type UseSelectorHook = <A>(
        fn: (root: Store.State) => A,
    ) => A;
}

export interface ReaderOption<S = Store.State> {
    at<const K extends keyof S>(key: K): ReaderOption<NonNullable<S[K]>>;
    filter<B extends S>(predicate: (a: S) => a is B): ReaderOption<B>;
    when(predicate: (a: S) => boolean): ReaderOption<S>;
    map: <B>(fn: (s: S) => B) => ReaderOption<B>;
    use: () => Option.Option<S>;
}

export interface Reader<S = Store.State> {
    at<const K extends keyof S>(key: K): Reader<S[K]>;
    filter<B extends S>(predicate: (a: S) => a is B): ReaderOption<B>;
    when(predicate: (a: S) => boolean): ReaderOption<S>;
    map: <B>(fn: (s: S) => B) => Reader<B>;
    use: () => S,
}

export interface Writer<S = Store.State> {
    at<const K extends keyof S>(key: K): Writer<S[K]>;
    set: (s: S) => Effect.Effect<Store.State>;
    update: (fn: (s: S) => S) => Effect.Effect<Store.State>;
}

export interface StateIO<S = Store.State> {
    at<const K extends keyof S>(key: K): StateIO<S[K]>;
    split: () => readonly [Reader<S>, Writer<S>];
    reader: () => Reader<S>;
    writer: () => Writer<S>;
}

const makeReaderOption = <A>(
    useSelector: Reader.UseSelectorHook,
    lens: ReadonlyPrism<Store.State, A>
): ReaderOption<A> => {
    return {
        at(key) {
            return makeReaderOption(useSelector, lens.at(key))
        },
        filter(predicate) {
            return makeReaderOption(useSelector, lens.filter(predicate));
        },
        when(predicate) {
            return makeReaderOption(useSelector, lens.filter(predicate));
        },
        map(fn) {
            return makeReaderOption(useSelector, lens.map(fn));
        },
        use() {
            return useSelector(root => lens.get(root));
        },
    }
}

const makeReader = <A>(
    useSelector: Reader.UseSelectorHook,
    lens: ReadonlyLens<Store.State, A>
): Reader<A> => {
    return {
        at(key) {
            return makeReader(useSelector, lens.at(key));
        },
        map(fn) {
            return makeReader(useSelector, lens.map(fn));
        },
        filter(predicate) {
            return makeReaderOption(useSelector, lens.filter(predicate))
        },
        when(predicate) {
            return makeReaderOption(useSelector, lens.filter(predicate))
        },
        use() {
            return useSelector(root => lens.get(root));
        },
    }
}

const makeWriter = <A>(
    update: (fn: (s: Store.State) => Store.State) => Effect.Effect<Store.State>,
    lens = Lens.id<A>() as unknown as Lens<Store.State, A>
): Writer<A> => {
    return {
        at(key) {
            return makeWriter(update, lens.at(key));
        },
        set(s) {
            return this.update(() => s);
        },
        update(fn) {
            return update(root => lens.update(fn)(root));
        },
    }
}

export const makeStateIO = <A>(
    useSelector: Reader.UseSelectorHook,
    update: (fn: (s: Store.State) => Store.State) => Effect.Effect<Store.State>, 
    lens = Lens.id<A>() as unknown as Lens<Store.State, A>
): StateIO<A> => {
    return {
        at(key) {
            return makeStateIO(useSelector, update, lens.at(key));
        },
        reader() {
            return makeReader(useSelector, lens.toReadonly());
        },
        writer() {
            return makeWriter(update, lens);
        },
        split() {
            return  [this.reader(), this.writer()];
        },
    }
}