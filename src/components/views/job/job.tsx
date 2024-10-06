import { Effect, Match, pipe } from "effect";
import { useEffect } from "react";
import styled from "styled-components";
import { JobRepo } from "../../../adapters/job.repository";
import { Services } from "../../services-provider/services.provider";
import { Resource } from "../../../support/effect";
import { ViewBase } from "../../view-base/view-base";
import { Loader } from "../../loader/loader";
import { FileContainer } from "../../../services/image-loader.service";
import { JobStateTag } from "../jobs/jobs";
import { capitalize } from "effect/String";
import { ModelResult } from "../../../adapters/workers/messages";

const Content = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    box-sizing: border-box;
    position: relative;
`

const JobInfoContainer = styled.div`
    box-sizing: border-box;
    padding: min(16px, 10%);
    height: 20%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
`

const InfoRow = styled.div`
    box-sizing: border-box;
    width: 100%;
    height: 50%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const Box = styled.div`
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
`

export const Job = ({ jobId }: { jobId: JobRepo.JobId }) => {
    const { worker, images, loader } = Services.use();

    const [canvasRef, imageState, imageController] = loader.useImageRenderer();

    const [jobResource] = worker.useJobView(jobId);

    const [imageResource] = images.useImage(() => {
        return pipe(
            jobResource,
            Resource.map(job => ({ id: job.imageId })),
            Resource.toOption
        )
    }, [jobResource])

    const resources = Resource.all({
        job: jobResource,
        image: imageResource,
    })

    useEffect(() => {
        pipe(
            imageResource,
            Resource.tap((image) => {
                if( imageState._tag === "None" ){
                    Effect.runPromise(imageController.render(FileContainer.fromImage(image)));
                }
            })
        )
    }, [imageResource, imageState])

    useEffect(() => {
        pipe(
            jobResource,
            Resource.tap(job => {
                if( "value" in job.result && imageState._tag === "Some" ){
                    const modelResult = job.result.value as ModelResult;
                    Effect.runPromise(imageController.renderParasites(modelResult));
                }
            })
        )
    },[jobResource, imageState])

    return <ViewBase 
        tall
        action="delete"
    >
        <Content>
        {
            pipe(
                Match.value(resources),
                Match.tag("Error", () => <>Something went wrong</>),
                Match.tag("Loading", () => <Loader />),
                Match.tag("Success", ({ data: { job, image }}) => <>
                    <JobInfoContainer>
                        <InfoRow>
                            <div>Job {job.id}</div>
                            <div>Paciente: {image.patientName}</div>
                            <div>Imagen: {image.imageName}</div>
                        </InfoRow>
                        <InfoRow>
                            <Box>
                                <JobStateTag state={job.state} />
                                {capitalize(job.state)}
                            </Box>
                            <div>Fecha: {job.createdAt.toISOString()}</div>
                        </InfoRow>
                    </JobInfoContainer>
                    <canvas ref={canvasRef} style={{ height: "80%", width: "100%" }} />
                </>),
                Match.exhaustive
            )
        }
        </Content>
    </ViewBase>
}