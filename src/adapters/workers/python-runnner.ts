import { loadPyodide } from "pyodide";
import { PythonIncomingMessage, Ready, Result, Started } from "./messages";
import { ImageRepo } from "../image.repository";
import { Option } from "effect";

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

let result = Option.none<string>();
const Python = await loadPyodide({
    indexURL: "/pyodide-mini",
    stdout: (answer) => {
        result = Option.some(answer);
    },
    stderr: console.error,
})

Python.FS.writeFile(PRETRAINED_PATH, pretrained);
await Python.loadPackagesFromImports(modelScript);

self.onmessage = async (e: MessageEvent<PythonIncomingMessage>) => {
    const { image, jobId } = e.data;
    const INPUT_PATH = ImageRepo.Utils.getFilePath(image);

    const env = new Interpolator({
        PRETRAINED_PATH,
        INPUT_PATH
    })

    Python.FS.writeFile(INPUT_PATH, image.data);

    self.postMessage(new Started({ jobId }))
    
    await Python.runPythonAsync(env.interpolate(modelScript));

    if( Option.isSome(result) ){
        const value = result.value;
        const data = JSON.parse(value);
        self.postMessage(new Result({
            data,
            jobId,
        }));
    }
    result = Option.none();
}

self.postMessage(new Ready)