import { Context, Effect, Layer, pipe } from "effect"
import { StateService } from "../../services/state.service"
import { ImageLoader } from "../../services/image-loader.service"
import { TIFFAdapter } from "../../adapters/tiff.adapter"
import { HttpAdapter } from "../../adapters/http.adapter"
import { DOMAdapter } from "../../adapters/dom.adapter"
import React, { createContext, useContext } from "react"
import { inject } from "../../support/effect/component"
import { Store } from "../../adapters/store.adapter"
import { RoutingService } from "../../services/routing.service"

export declare namespace Services {
    type Shape = {
        tiffLoader: ImageLoader.Shape,
        stateService: StateService.Shape,
        router: RoutingService.Shape
    }
}

const ServicesContext = createContext({} as Services.Shape)

export class Services 
extends Context.Tag("@providers/main")<
    Services,
    Services.Shape
>(){

    static use = () => useContext(ServicesContext);

    static Live = Layer.effect(Services, Effect.all({
        tiffLoader: ImageLoader,
        stateService: StateService,
        router: RoutingService,
    }))
    .pipe(Layer.provide(RoutingService.Live))
    .pipe(Layer.provide(StateService.Live))
    .pipe(Layer.provide(Store.Live))
    .pipe(Layer.provide(ImageLoader.Live))
    .pipe(Layer.provide(TIFFAdapter.Live))
    .pipe(Layer.provide(HttpAdapter.Live))
    .pipe(Layer.provide(DOMAdapter.Live))
}

export const ServicesProvider = pipe(
    Services,
    Effect.map(services => ({ children }: { children: React.ReactNode }) => {
        return <ServicesContext.Provider value={services}>
            {children}
        </ServicesContext.Provider>
    }),
    inject(Services.Live)
)