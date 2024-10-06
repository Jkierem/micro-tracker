import { loadPyodide } from "pyodide";
import { JobError, PythonIncomingMessage, Ready, Result, Started } from "./messages";
import { ImageRepo } from "../image.repository";
import { ModelResultRepo } from "../model-result.repository";

// This flag disables printing the error messages received from python
const SUPPRESS_PYTHON_WARININGS = true;

class Interpolator {
    private interpolations: Record<string, string>;
    constructor(initial: Record<string, string> = {}){
        this.interpolations = initial;
    }

    interpolate(text: string): string {
        return Object
            .entries(this.interpolations)
            .reduce((acc, [key, value]: [string, string]) => {
                return acc.replace(`__${key}__`, `"${value}"`)
            }, text);
    }
}

const PRETRAINED_PATH = "pre-trained.pkl";
const pretrained = await fetch(`/${PRETRAINED_PATH}`)
    .then(req => req.arrayBuffer())
    .then(buff => new Uint8Array(buff))

const modelScript = await fetch("/model.py")
    .then(req => req.text())

let detection = [] as ModelResultRepo.ModelResult['detection'];
const Python = await loadPyodide({
    indexURL: "/pyodide-mini",
    stdout: (data) => {
        detection = (JSON.parse(data) as { parasite: ModelResultRepo.ModelResult['detection'] }).parasite;
    },
    stderr: (...args) => {
        if( !SUPPRESS_PYTHON_WARININGS ){
            console.error(...args);
        }
    },
})

Python.FS.writeFile(PRETRAINED_PATH, pretrained);
await Python.loadPackagesFromImports(modelScript);

self.onmessage = async (e: MessageEvent<PythonIncomingMessage>) => {
    const { image, jobId } = e.data;
    const INPUT_PATH = ImageRepo.Utils.getFilePath(image);
    const OUTPUT_PATH = `${jobId}-results.png`;

    const env = new Interpolator({
        PRETRAINED_PATH,
        INPUT_PATH,
        OUTPUT_PATH,
    })

    Python.FS.writeFile(INPUT_PATH, image.data);

    self.postMessage(new Started({ jobId }))
    
    await Python.runPythonAsync(env.interpolate(modelScript));

    try {
        const image = Python.FS.readFile(OUTPUT_PATH) as Uint8Array;
        self.postMessage(new Result({
            image,
            detection,
            jobId,
        }), { transfer: [image.buffer]});
    } catch {
        self.postMessage(new JobError({ jobId }))
    } finally {
        detection = [];
    }
}

self.postMessage(new Ready)