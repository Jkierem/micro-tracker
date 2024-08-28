import { Context, Effect, Layer, pipe } from "effect"
import React, { createContext, useContext } from "react"
import { BitmapAdapter } from "../../adapters/bitmap.adapter"
import { DOMAdapter } from "../../adapters/dom.adapter"
import { HttpAdapter } from "../../adapters/http.adapter"
import { ImageRepo } from "../../adapters/image.repository"
import { IndexedDBAdapter } from "../../adapters/indexed-db/index-db.adapter"
import { NavigatorAdapter } from "../../adapters/navigator.adapter"
import { Store } from "../../adapters/store.adapter"
import { TIFFAdapter } from "../../adapters/tiff.adapter"
import { ImageLoader } from "../../services/image-loader.service"
import { ImageService } from "../../services/image.service"
import { RoutingService } from "../../services/routing.service"
import { StateService } from "../../services/state.service"
import { TIFFLoader } from "../../services/tiff-loader.service"
import { VideoService } from "../../services/video.service"
import { inject } from "../../support/effect/component"
import { FileService } from "../../services/file.service"
import { UrlAdapter } from "../../adapters/url.adapter"

export declare namespace Services {
    type Shape = {
        loader: ImageLoader.Shape,
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
        loader: ImageLoader,
        stateService: StateService,
        router: RoutingService,
        images: ImageService,
        video: VideoService,
    }))
    .pipe(Layer.provide(ImageLoader.Live))
    .pipe(Layer.provide(VideoService.Live))
    .pipe(Layer.provide(ImageService.Live))
    .pipe(Layer.provide(ImageRepo.Live))
    .pipe(Layer.provide(RoutingService.Live))
    .pipe(Layer.provide(StateService.Live))
    .pipe(Layer.provide(Store.Live))
    .pipe(Layer.provide(FileService.Live))
    .pipe(Layer.provide(UrlAdapter.Live))
    .pipe(Layer.provide(TIFFLoader.Live))
    .pipe(Layer.provide(TIFFAdapter.Live))
    .pipe(Layer.provide(BitmapAdapter.Live))
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
    inject(Services.Live, {
        fallback: <>Loading...</>,
    })
)