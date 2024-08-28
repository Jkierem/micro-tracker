import { Chunk, Console, Effect, Layer, pipe, Queue } from "effect";
import { Services } from "../services-provider/services.provider"
import { PythonService } from "../../services/python.service";
import { inject } from "../../support/effect/component";
import { PyodideAdapter } from "../../adapters/pyodide.adapter";

const testScript = "import joblib\n"+
    "import cv2\n" +
    "import numpy as np\n" +
    "from skimage.measure import shannon_entropy\n" +
    "from skimage.measure import label, regionprops\n" +
    "from skimage.feature import graycomatrix, graycoprops\n" +
    "from scipy.stats import skew, kurtosis\n" +
    "from skimage import measure\n" +
    "from sklearn.cluster import KMeans\n" +
    "import os\n" +
    "from pathlib import Path\n" +
    "import logging\n" +
    "from pathlib import Path\n"+
    'print(Path("/test.txt").read_text())\n'+
    'a = "Hola tu"\na\n';

export const PyTest = ({ python }: { python: PythonService.Shape }) => {
    const { router } = Services.use();

    const handleRun = () => {
        return Effect.gen(function*(_){
            const std = yield* python.Messages.subscribe;

            yield* python.run(testScript)
            
            yield* _(
                std,
                Queue.takeAll,
                Effect.map(Chunk.toArray),
                Effect.andThen(arr => Effect.all(arr.map(a => Console.log(a))))
            )
        }).pipe(
            Effect.tap(Effect.log),
            Effect.scoped,
            Effect.runPromise
        )
    }

    return <>
        <div>
            <button onClick={handleRun}>Run!</button>
        </div>
        <div>
            <button onClick={() => Effect.runSync(router.goBack())}>Go back</button>
        </div>
    </>
}

const Dependencies = pipe(
    PythonService.Live,
    Layer.provide(PyodideAdapter.Live),
)

export const Python = pipe(
    PythonService,
    Effect.map((service) => {
        return () => <PyTest python={service}/>
    }),
    inject(Dependencies, {
        fallback: <>Loading python...</>,
        onError(error) {
            console.log(error);
            return <>Something went wrong</>
        },
    })
)
