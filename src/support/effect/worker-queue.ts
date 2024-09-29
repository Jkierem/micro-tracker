import { ImageRepo } from "../../adapters/image.repository"
import { lock, free, isReady, QueueState, Ready, Waiting } from "./queue-state"

export type Job = {
    image: ImageRepo.Image
}

export declare namespace Queue {
    type Queue = {
        state: QueueState
        queue: Job[]
        bind(worker: Worker): void
        enqueue(job: Job): void
        check(): void
    }
}

class WorkerQueue<ProccessResult> implements Queue {
    public queue: Job[];
    public state: QueueState;
    constructor(private onFinishTask: (result: ProccessResult) => void){
        this.state = new Waiting;
        this.queue = []
    }

    bind(worker: Worker): void {
        worker.onmessage = (e: MessageEvent<ProccessResult>) => {
            this.onFinishTask(e.data)
            this.state = free(this.state);
            this.check()
        }
        this.state = new Ready({ worker });
        this.check();
    }

    enqueue(job: Job): void {
        this.queue.push(job);
        this.check();
    }

    check(){
        if( 
            this.queue.length !== 0 
            && isReady(this.state)
        ){
            const job = this.queue.pop()!
            this.state.worker.postMessage(job, [job.image.data.buffer]);
            this.state = lock(this.state);
        }
    }
}

export class Queue {
    static make<T>(onFinishTask: (result: T) => void){
        return new WorkerQueue(onFinishTask) as Queue.Queue;
    }
}


