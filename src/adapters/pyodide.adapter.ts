import { Context, Layer, Effect, Data, PubSub, pipe } from "effect";
import { loadPyodide } from "pyodide";

export class InitializePyError
extends Data.TaggedError("InitializePyError")<{ error: unknown }> {}

export class LoadPackageError
extends Data.TaggedError("LoadPackageError")<{ error: unknown }> {}

export class WriteFileError
extends Data.TaggedError("WriteFileError")<{ error: unknown }> {}

export class ExecutionPyError
extends Data.TaggedError("ExecutionPyError")<{ error: unknown }> {}

export class StdOut
extends Data.TaggedClass("StdOut")<{ message: string }> {}

export class StdErr
extends Data.TaggedClass("StdErr")<{ message: string }> {}

export declare namespace PyodideAdapter {
    type PyMessage = StdOut | StdErr
    type PyRuntimeError = WriteFileError | LoadPackageError

    type Runner = {
        run: (code: string) => Effect.Effect<void, ExecutionPyError>;
        Messages: PubSub.PubSub<PyMessage>;
    }

    type PyodideApi = {
        loadPackage: (name: string | string[]) => Effect.Effect<void, LoadPackageError>;
        loadFile: (path: string, data: ArrayBuffer) => Effect.Effect<void, WriteFileError>;
        loadTextFile: (path: string, data: string) => Effect.Effect<void, WriteFileError>;
    }

    type Runtime = {
        withRuntime: <E>(fn: (api: PyodideApi) => Effect.Effect<void, E>) => Effect.Effect<Runner, E>;
    }

    type Shape = {
        Pyodide: Effect.Effect<Runtime, InitializePyError | LoadPackageError | WriteFileError>;
    }
}

export class PyodideAdapter
extends Context.Tag("PyodideAdapter")<
    PyodideAdapter,
    PyodideAdapter.Shape
>(){
    static Live = Layer.effect(PyodideAdapter, Effect.gen(function*(_){
        const Messages = yield* PubSub.unbounded<PyodideAdapter.PyMessage>();

        const LoadPyodide = yield* pipe(
            Effect.tryPromise({
                try(){
                    return loadPyodide({
                        indexURL: "/pyodide-mini",
                        stdout(message){
                            pipe(
                                Messages,
                                PubSub.publish<PyodideAdapter.PyMessage>(new StdOut({ message })),
                                Effect.runPromise
                            )
                        },
                        stderr(message) {
                            pipe(
                                Messages,
                                PubSub.publish<PyodideAdapter.PyMessage>(new StdErr({ message })),
                                Effect.runPromise
                            )
                        },
                    })
                },
                catch(error) {
                    return new InitializePyError({ error });
                },
            }),
            Effect.cached
        )

        return PyodideAdapter.of({
            Pyodide: Effect.gen(function*(_){
                const pyodide = yield* LoadPyodide;

                const api = {
                    loadPackage(name: string | string[]) {
                        return Effect.tryPromise({
                            try: () => pyodide.loadPackage(name),
                            catch: (error) => new LoadPackageError({ error }),
                        })
                    },
                    loadFile(path: string, data: ArrayBuffer) {
                        return Effect.try({
                            try: () => pyodide.FS.writeFile(path, data),
                            catch: (error) => new WriteFileError({ error })
                        })
                    },
                    loadTextFile(path: string, data: string) {
                        return Effect.try({
                            try: () => pyodide.FS.writeFile(path, data, { encoding: "utf-8" }),
                            catch: (error) => new WriteFileError({ error })
                        })
                    },
                }

                return {
                    withRuntime: (fn) => {
                        return Effect.gen(function*(_){
                            yield* fn(api);
                            return {
                                Messages,
                                run(code) {
                                    return Effect.tryPromise({
                                        try: () => pyodide.runPythonAsync(code),
                                        catch: (error) => {
                                            return new ExecutionPyError({ error })
                                        }
                                    })
                                },
                            }
                        })
                    }
                }
            })
        })
    }))
}