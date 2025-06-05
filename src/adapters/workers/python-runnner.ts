import { loadPyodide } from "pyodide";
import { JobError, PythonIncomingMessage, Ready, Result, Started } from "./messages";
import { ImageRepo } from "../image.repository";
import { DetectionData } from "../model-result.repository";
import { Option, Schema } from "effect";

const readEnvFlag = (key: `VITE_SUPPRESS_PYTHON_${"WARNINGS" | "ERRORS"}`) => {
    const value = import.meta.env[key]
    return value === undefined 
        ? import.meta.env.PROD 
        : value.toLowerCase() === "true"
}

const SUPPRESS_PYTHON_WARNINGS = readEnvFlag("VITE_SUPPRESS_PYTHON_WARNINGS");
const SUPPRESS_PYTHON_ERRORS = readEnvFlag("VITE_SUPPRESS_PYTHON_ERRORS");

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


const DetectionResult = Schema.Struct({
    parasite: DetectionData
})
type DetectionResult = Schema.Schema.Type<typeof DetectionResult>;

let detection = Option.none<DetectionResult>();
const parseDetectionResult = Schema.decodeOption(Schema.parseJson(DetectionResult));

const Python = await loadPyodide({
    indexURL: "/pyodide-mini",
    stdout: (data) => {
        detection = parseDetectionResult(data);
    },
    stderr: (...args) => {
        if( !SUPPRESS_PYTHON_WARNINGS ){
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
    
    try {
        await Python.runPythonAsync(env.interpolate(modelScript));
        if( Option.isNone(detection) ){
            throw new Error("No result or invalid result")
        }

        const image = Python.FS.readFile(OUTPUT_PATH) as Uint8Array;
        self.postMessage(new Result({
            image,
            detection: detection.value.parasite,
            jobId,
        }), { transfer: [image.buffer]});
    } catch(e) {
        if( !SUPPRESS_PYTHON_ERRORS ){
            console.error(e);
        }
        self.postMessage(new JobError({ jobId }))
    } finally {
        detection = Option.none();
    }
}

self.postMessage(new Ready)