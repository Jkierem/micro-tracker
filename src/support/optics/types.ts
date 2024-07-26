export declare namespace Optics {
    export type Get<S, A> = (s: S) => A;
    export type Set<S, A> = (s: S, a: A) => S;
}