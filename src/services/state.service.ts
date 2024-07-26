import { Context, Effect, Layer } from "effect"
import { makeStateIO, StateIO } from "../support/effect/state-io"
import { Store } from "../adapters/store.adapter"
import { useMemo, useSyncExternalStore } from "react"

export declare namespace StateService {
    type State = Store.State

    type Shape = {
        Global: StateIO;
        get: () => Effect.Effect<Store.State>
    }
}

export class StateService
extends Context.Tag("@services/state")<
    StateService,
    StateService.Shape
>(){
    static Live = Layer.effect(StateService, Effect.gen(function*(_){
        const store = yield* _(Store);

        const useSelector = <A>(fn: (root: StateService.State) => A) => {
            const state = useSyncExternalStore(
                (listener) => store.subscribe(listener).pipe(Effect.runSync),
                () => store.get().pipe(Effect.runSync)
            )

            return useMemo(() => fn(state), [state])
        }

        return StateService.of({
            Global: makeStateIO(useSelector, (fn) => store.update(fn)),
            get: () => store.get()
        })
    }))
}