import { loadPyodide } from "pyodide";
import { Ready, Result } from "./messages";
import { ImageRepo } from "../image.repository";

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

const Python = await loadPyodide({
    indexURL: "/pyodide-mini",
    stdout: console.log,
    stderr: console.error,
})

Python.FS.writeFile(PRETRAINED_PATH, pretrained);
await Python.loadPackagesFromImports(modelScript);

self.postMessage(new Ready)

self.onmessage = (e: MessageEvent<{ image: ImageRepo.Image }>) => {
    const { image } = e.data;
    const INPUT_PATH = ImageRepo.Utils.getFilePath(image);
    console.group("Python");
    console.log("Event: ", e);
    console.log("File Path:", INPUT_PATH);
    console.groupEnd();

    const env = new Interpolator({
        PRETRAINED_PATH,
        INPUT_PATH
    })

    Python.FS.writeFile(INPUT_PATH, image.data);
    
    Python.runPython(env.interpolate(modelScript));

    self.postMessage(new Result({ data: { parasite: [] }}));
}