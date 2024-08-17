import { Context, Effect, Layer, pipe } from "effect"
import { StateService } from "../../services/state.service"
import { TIFFLoader } from "../../services/tiff-loader.service"
import { TIFFAdapter } from "../../adapters/tiff.adapter"
import { HttpAdapter } from "../../adapters/http.adapter"
import { DOMAdapter } from "../../adapters/dom.adapter"
import React, { createContext, useContext } from "react"
import { inject } from "../../support/effect/component"
import { Store } from "../../adapters/store.adapter"
import { RoutingService } from "../../services/routing.service"
import { ImageService } from "../../services/image.service"
import { IndexedDBAdapter } from "../../adapters/indexed-db/index-db.adapter"
import { ImageRepo } from "../../adapters/image.repository"
import { VideoService } from "../../services/video.service"
import { NavigatorAdapter } from "../../adapters/navigator.adapter"

export declare namespace Services {
    type Shape = {
        tiffLoader: TIFFLoader.Shape,
        stateService: StateService.Shape,
        router: RoutingService.Shape,
        images: ImageService.Shape,
        video: VideoService.Shape,
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
        tiffLoader: TIFFLoader,
        stateService: StateService,
        router: RoutingService,
        images: ImageService,
        video: VideoService,
    }))
    .pipe(Layer.provide(VideoService.Live))
    .pipe(Layer.provide(ImageService.Live))
    .pipe(Layer.provide(ImageRepo.Live))
    .pipe(Layer.provide(RoutingService.Live))
    .pipe(Layer.provide(StateService.Live))
    .pipe(Layer.provide(Store.Live))
    .pipe(Layer.provide(TIFFLoader.Live))
    .pipe(Layer.provide(TIFFAdapter.Live))
    .pipe(Layer.provide(IndexedDBAdapter.Live))
    .pipe(Layer.provide(HttpAdapter.Live))
    .pipe(Layer.provide(NavigatorAdapter.Live))
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