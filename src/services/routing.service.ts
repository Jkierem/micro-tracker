import { Context, Effect, Layer, Option, pipe, Ref } from "effect"
import { View, Views } from "../support/routing/views";
import { StateService } from "./state.service";

export declare namespace RoutingService {
    type Shape = {
        useCurrentView: () => View;
        goBack: () => Effect.Effect<void>;
        goTo: (next: View) => Effect.Effect<void>; 
    } & { [P in View['_tag'] as `goTo${P}`]: () => void}
}

export class RoutingService 
extends Context.Tag("@service/routing")<
    RoutingService,
    RoutingService.Shape
>(){
    static Live = Layer.effect(RoutingService, Effect.gen(function*(_){
        const state = yield* _(StateService);

        const [reader, writer] = state.Global.at("view").split();

        const HISTORY_LIMIT = 10;

        const history = yield* _(
            state.get(),
            Effect.map(global => global.view),
            Effect.flatMap(initial => Ref.make([ initial ])),
            Effect.map(ref => {
                return {
                    push(view: View){
                        return pipe(
                            ref,
                            Ref.update(prev => prev.length >= HISTORY_LIMIT ? [...prev.slice(1), view] : [...prev, view]),
                            Effect.zipLeft(writer.set(view)),
                        )
                    },
                    pop(){
                        return pipe(
                            ref,
                            Ref.updateAndGet(prev => prev.slice(0,-1)),
                            Effect.flatMap(hist => {
                                return pipe(
                                    Option.fromNullable(hist.at(-1)),
                                    Option.map(prev => writer.set(prev).pipe(Effect.ignore)),
                                    Option.getOrElse(() => Effect.void)
                                )
                            })
                        )
                    }
                }
            })
        )

        const dynamics = (Object.keys(Views) as (View['_tag'])[]).reduce((dyn, view) => {
            return {
                ...dyn,
                [`goTo${view}`](){
                    return history.push(Views[view]()).pipe(Effect.runSync);
                }
            }
        }, {} as { [P in View['_tag'] as `goTo${P}`]: () => Effect.Effect<void>})

        return RoutingService.of({
            useCurrentView() {
                return reader.use();
            },
            goBack() {
                return history.pop()
            },
            goTo(view) {
                return history.push(view)
            },
            ...dynamics,
        })
    }))
}