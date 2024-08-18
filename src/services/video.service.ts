import { Context, Data, Effect, Layer, Option, pipe } from "effect";
import { MutableRefObject, useRef } from "react";
import { NavigatorAdapter } from "../adapters/navigator.adapter";
import { NoSuchElementException } from "effect/Cause";
import { ImageRepo } from "../adapters/image.repository";

export class PlaybackError
extends Data.TaggedError("PlaybackError")<{ error: unknown }> {}

export class SerializeError
extends Data.TaggedError("SerializeError")<{ error: unknown }> {}

export declare namespace VideoService {
    type VideoController = {
        startCapture: () => Effect.Effect<void>;
        stopCapture: () => Effect.Effect<void>;
        takeSnapshot: () => Effect.Effect<[ArrayBuffer, ImageRepo.Dimensions], SerializeError | NoSuchElementException>;
    }
    type Shape={
        useVideoCapture: () => [
            MutableRefObject<HTMLVideoElement | null>,
            MutableRefObject<HTMLCanvasElement | null>,
            VideoController
        ]
    }
}
export class VideoService
extends Context.Tag("VideoService")<
    VideoService,
    VideoService.Shape
>(){
    static Live = Layer.effect(VideoService, Effect.gen(function*(_){
        const media = yield* NavigatorAdapter;
        
        return VideoService.of({
            useVideoCapture() {
                const videoRef = useRef<HTMLVideoElement>(null);
                const canvasRef = useRef<HTMLCanvasElement>(null);

                const controller: VideoService.VideoController = {
                    startCapture(){
                        return Effect.gen(function*(_){
                            const video = yield* (Option.fromNullable(videoRef.current));
                            const stream = yield* media.getVideo();

                            video.srcObject = stream;
                            return yield* Effect.tryPromise({
                                try: () => video.play(),
                                catch: error => new PlaybackError({ error })
                            })
                        }).pipe(Effect.catchAll(e => Effect.logError(e)))
                    },
                    stopCapture() {
                        return pipe(
                            Option.fromNullable(videoRef.current),
                            Effect.map(video => {
                                const stream = video.srcObject as MediaStream | null;
                                if( stream ){
                                    stream.getVideoTracks().forEach(track => {
                                        stream.removeTrack(track);
                                        track.stop();
                                    });
                                }
                                video.srcObject = null;
                            }),
                            Effect.ignore,
                        )
                    },
                    takeSnapshot() {
                        return pipe(
                            Effect.Do,
                            Effect.bind("video", () => Option.fromNullable(videoRef.current)),
                            Effect.bind("canvas", () => Option.fromNullable(canvasRef.current)),
                            Effect.bind("ctx", ({ canvas }) => Option.fromNullable(canvas.getContext("2d"))),
                            Effect.flatMap(({ video, canvas, ctx }) => {
                                canvas.width = 640;
                                canvas.height = 480;
                                ctx.drawImage(video, 0, 0, 640, 480);
                                return Effect.tryPromise({
                                    try: () => new Promise<Blob>((res, rej) => canvas.toBlob((blob) => blob ? res(blob) : rej(blob), "image/png")),
                                    catch(error) {
                                        return new SerializeError({ error });
                                    },
                                })
                            }),
                            Effect.flatMap(blob => {
                                return Effect.tryPromise({
                                    try: () => blob.arrayBuffer(),
                                    catch(error) {
                                        return new SerializeError({ error })
                                    },
                                })
                            }),
                            Effect.zip(Effect.succeed({ width: 640, height: 480 }))
                        )
                    },
                }

                return [videoRef, canvasRef, controller] as const;
            },
        })
    }))
}