import { Context } from "effect";

export declare namespace JobService {
    type Shape = {
        schedule: (imageId: string) => void;
        
    }
}

export class JobService
extends Context.Tag("JobService")<
    JobService,
    JobService.Shape
>(){
}