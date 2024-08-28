import { Context, Layer, Effect, PubSub, pipe } from "effect";
import { ExecutionPyError, PyodideAdapter } from "../adapters/pyodide.adapter";

export declare namespace PythonService {
    type Shape = {
        Messages: PubSub.PubSub<PyodideAdapter.PyMessage>,
        run: (code: string) => Effect.Effect<void, ExecutionPyError>
    }
}

export class PythonService
extends Context.Tag("@services/python")<
    PythonService,
    PythonService.Shape
>(){
    static Live = Layer.effect(PythonService, Effect.gen(function*(_){
        const pyodide = yield* PyodideAdapter

        const py = yield* (yield* pipe(
            pyodide.Pyodide,
            Effect.flatMap(runtime => {
                return runtime.withRuntime(api => {
                    return Effect.gen(function*(_){
                        yield* api.loadTextFile("/test.txt", "Everything is fine")
                        yield* api.loadPackage([
                            "numpy",
                            "joblib",
                            "opencv-python",
                            "scikit-learn",
                            "scikit-image",
                        ])
                    })
                })
            }),
            Effect.cached
        ))

        return PythonService.of(py);
    }))
}