import { Context, Data, Effect, Fiber, Layer, Option, pipe, Queue, Ref, Schedule } from "effect";
import { MutableRefObject, useEffect, useRef } from "react";
import { NavigatorAdapter } from "../adapters/navigator.adapter";
import { NoSuchElementException } from "effect/Cause";
import { ImageRepo } from "../adapters/image.repository";
import { CanvasUtilities } from "../support/render/canvas";

export class PlaybackError
extends Data.TaggedError("PlaybackError")<{ error: unknown }> {}

export class SerializeError
extends Data.TaggedError("SerializeError")<{ error: unknown }> {}

export class StartVideo
extends Data.TaggedClass("StartVideo")<{
    videoRef: React.RefObject<HTMLVideoElement>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
}> {}

export class StopVideo
extends Data.TaggedClass("StopVideo")<{
    videoRef: React.RefObject<HTMLVideoElement>,
}> {}

type VideoEvent = StartVideo | StopVideo;

export declare namespace VideoService {
    type Snapshot = [ArrayBuffer, ImageRepo.Dimensions]

    type VideoController = {
        useCaptureOnMount: () => void;
        startCapture: () => Effect.Effect<void>;
        stopCapture: () => Effect.Effect<void>;
        takeSnapshot: () => Effect.Effect<Snapshot, SerializeError | NoSuchElementException>;
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
        const capturing = yield* Ref.make(false);
        const requests = yield* Queue.unbounded<VideoEvent>();
        let currentFrame: undefined | number;

        const startEvent = ({ canvasRef, videoRef }: StartVideo) => Effect.gen(function*(_){
            const video = yield* (Option.fromNullable(videoRef.current));
            const stream = yield* media.getVideo();
            video.srcObject = stream;
            yield* Effect.async((resume) => {
                video.addEventListener("canplay", () => {
                    resume(Effect.void);
                },{ once: true });
            })
            yield* Ref.set(capturing, true);
            yield* Effect.tryPromise({
                try: () => video.play(),
                catch: error => {
                    console.error(error);
                    return new PlaybackError({ error })
                }
            })

            const canvas = yield* Option.fromNullable(canvasRef.current);
            const ctx = yield* Option.fromNullable(canvas.getContext("2d"))
            const paint = () => {
                CanvasUtilities.paintWithAspectRatio(canvas, ctx, video);
                if( capturing ){
                    currentFrame = requestAnimationFrame(paint)
                }
            }
            currentFrame = requestAnimationFrame(paint);
        }).pipe(
            Effect.unlessEffect(capturing.get),
            Effect.catchAll(e => {
                return Effect.logError(e)
            })
        )

        const stopEvent = ({ videoRef }: StopVideo) =>  Effect.gen(function*(_){
            const video = yield* Option.fromNullable(videoRef.current);
            const stream = video.srcObject as MediaStream | null;
            if( stream ){
                stream.getVideoTracks().forEach(track => {
                    stream.removeTrack(track);
                    track.stop();
                });
            }
            video.srcObject = null;
            
            if( currentFrame !== undefined ){
                cancelAnimationFrame(currentFrame);
            }
            yield* Ref.set(capturing, false);
        }).pipe(
            Effect.whenEffect(capturing.get),
            Effect.ignore
        );

        const startListener = Effect.gen(function*(){
            const event = yield* Queue.take(requests);
            switch(event._tag){
                case "StartVideo":
                    return yield* startEvent(event);
                case "StopVideo":
                    return yield* stopEvent(event)
            }
        }).pipe(Effect.repeat(Schedule.forever))
        
        return VideoService.of({
            useVideoCapture() {
                const videoRef = useRef<HTMLVideoElement>(null);
                const canvasRef = useRef<HTMLCanvasElement>(null);
                useEffect(() => {
                    const fiber = startListener.pipe(Effect.runFork)
                    return () => {
                        Effect.runFork(Fiber.interrupt(fiber));
                    }
                },[])

                const controller: VideoService.VideoController = {
                    useCaptureOnMount() {
                        useEffect(() => {
                            this.startCapture().pipe(Effect.runPromise);
                            return () => {
                                this.stopCapture().pipe(Effect.runPromise);
                            }
                        },[])
                    },
                    startCapture(){
                        return requests.offer(new StartVideo({ canvasRef, videoRef }));
                    },
                    stopCapture() {
                        return requests.offer(new StopVideo({ videoRef }));
                    },
                    takeSnapshot() {
                        return pipe(
                            Effect.Do,
                            Effect.bind("video", () => Option.fromNullable(videoRef.current)),
                            Effect.bind("canvas", () => Option.fromNullable(new OffscreenCanvas(100,100))),
                            Effect.bind("ctx", ({ canvas }) => Option.fromNullable(canvas.getContext("2d"))),
                            Effect.flatMap(({ video, canvas, ctx }) => {
                                return Effect.gen(function*(){
                                    CanvasUtilities.paint(canvas, ctx, video);
                                    const blob = yield* Effect.tryPromise({
                                        try: () => canvas.convertToBlob({ type: "image/png" }),
                                        catch(error) {
                                            return new SerializeError({ error });
                                        },
                                    })

                                    const buffer = yield* Effect.tryPromise({
                                        try: () => blob.arrayBuffer(),
                                        catch(error) {
                                            return new SerializeError({ error })
                                        },
                                    })

                                    return [buffer, {
                                        width: video.videoWidth,
                                        height: video.videoHeight,
                                    }] as const
                                })
                            }),
                        )
                    },
                }

                return [videoRef, canvasRef, controller] as const;
            },
        })
    }))
}