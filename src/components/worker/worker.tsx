import { useState } from "react";
import { Services } from "../services-provider/services.provider";
import { Effect, pipe } from "effect";

export const Worker = () => {
    const { worker } = Services.use();

    const [pingWorker, setWorker] = useState<Worker | undefined>(undefined);

    const handleInit = () => {
        if( pingWorker ){
            pingWorker.terminate();
            setWorker(undefined);
        }
        pipe(
            worker.instantiate("MessageQueue"),
            Effect.tap(worker => {
                worker.onmessage = (e) => {
                    console.log("Main Thread: ", e.data);
                }
            }),
            Effect.tap(ping => setWorker(ping)),
            Effect.runPromise
        )
        
    }

    const handleClick = () => {
        if( pingWorker ){
            pingWorker.postMessage({ imageId: 28 });
        }
    }

    return <>
        <button onClick={handleInit}>Init</button>
        <button disabled={!pingWorker} onClick={handleClick}>Message Worker</button>
    </>
}