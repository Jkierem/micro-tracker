import { Context, Effect, Equal, Layer, pipe, Ref } from "effect";
import { View, Views } from "../support/routing/views";

export declare namespace Store {
    type State = {
        view: View,
        count: number,
    }
    type Unsubscribe = () => void;
    type Listener = (snap: State) => void
    type Update = (prev: State) => State

    type Shape = {
        get: () => Effect.Effect<State>,
        subscribe: (fn: Listener) => Effect.Effect<Unsubscribe>,
        update: (fn: Update) => Effect.Effect<State>,
    }
}

export class Store
extends Context.Tag("@adapters/state/initial")<
    Store,
    Store.Shape
>(){
    private static onMainMenu: Store.State = {
        view: Views.Main(),
        count: 0
    }

    static Live = Layer.effect(
        Store,
        Effect.gen(function*(_){
            const state = yield* _(
                Ref.make(Store.onMainMenu),
                Effect.map(ref => ({
                    read: Ref.get(ref),
                    update: (fn: Store.Update) => Ref.updateAndGet(ref, fn)
                }))
            );

            const callbacks = yield* _(
                Ref.make([] as Store.Listener[]),
                Effect.map(ref => ({
                    add: (listener: Store.Listener) => {
                        return pipe(
                            ref,
                            Ref.update(prev => [...prev, listener]),
                            Effect.map(() => {
                                return () => pipe(
                                    ref,
                                    Ref.update(prev => prev.filter(ls => ls !== listener))
                                )
                            }),
                        )
                    },
                    forEach: (fn: (listener: Store.Listener) => void) => {
                        return pipe(
                            Ref.get(ref),
                            Effect.map(cbs => cbs.forEach(fn))
                        )
                    }
                }))
            )

            return Store.of({
                subscribe(fn) {
                    return callbacks.add(fn);
                },
                get() {
                    return state.read;
                },
                update(fn) {
                    return pipe(
                        state.read,
                        Effect.bindTo("prev"),
                        Effect.bind("next", () => state.update(fn)),
                        Effect.flatMap(({ prev, next }) => {
                            if( !Equal.equals(prev, next) ){
                                return pipe(
                                    callbacks.forEach(fn => fn(next)),
                                    Effect.as(next)
                                )
                            }
                            return Effect.succeed(prev);
                        }),
                    );
                },
            })
        })
    )
}