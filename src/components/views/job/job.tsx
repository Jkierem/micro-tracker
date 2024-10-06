import { Effect, Match, Option, pipe } from "effect";
import { useEffect, useRef } from "react";
import styled from "styled-components";
import { JobRepo } from "../../../adapters/job.repository";
import { Services } from "../../services-provider/services.provider";
import { Resource } from "../../../support/effect";
import { ViewBase } from "../../view-base/view-base";
import { Loader } from "../../loader/loader";
import { FileContainer } from "../../../services/image-loader.service";
import { JobStateTag } from "../jobs/jobs";
import { capitalize } from "effect/String";
import { useOptional } from "../../../support/effect/use-optional";
import { ModelResultRepo } from "../../../adapters/model-result.repository";
import { formatDate } from "../../../support/optics/date-formatter";
import { DeleteJobModal } from "../../delete-job-modal /delete-job-modal";

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
    const { worker, images, loader, router } = Services.use();
    const renderingRef = useRef("initial" as "initial" | "input" | "result");
    const [canvasRef, _, imageController] = loader.useImageRenderer();
    const [modelResult, setModelResult] = useOptional<ModelResultRepo.ModelResult>();
    const [deleteCandidate, setDeleteCandidate] = useOptional<JobRepo.Job>();

    const [jobResource] = worker.useJobView(jobId);

    const [imageResource] = images.useImage(() => {
        return pipe(
            jobResource,
            Resource.map(job => ({ id: job.imageId })),
            Resource.toOption
        )
    }, [jobResource]);

    const canDelete = pipe(
        jobResource,
        Resource.map(job => job.state),
        Resource.getOrElse(() => "waiting" as JobRepo.JobState),
        state => state === "error" || state === "finished"
    )

    const handleDeleteCandidate = () => {
        pipe(
            jobResource,
            Resource.getSuccess,
            Option.map(job => {
                setDeleteCandidate(job);
            })
        )
    }

    const handleDelete = () => {
        Effect.runPromise(router.goBack());
    }

    useEffect(() => {
        pipe(
            Match.value(jobResource),
            Match.tag("Success", ({ data }) => {
                const resultId = data.result.pipe(Option.getOrUndefined);
                if( resultId ){
                    if( Option.isNone(modelResult)){
                        worker.getJobResult(resultId).pipe(
                            Effect.tap((res) => setModelResult(res)),
                            Effect.flatMap((res) => {
                                return imageController.render({ data: res.image, type: "image/png" })
                            }),
                            Effect.tap(() => { renderingRef.current = "result" }),
                            Effect.runPromise
                        )
                    }
                } else {
                    if( renderingRef.current === "initial" ){
                        pipe(
                            Match.value(imageResource),
                            Match.tag("Success", ({ data }) => {
                                renderingRef.current = "input";
                                Effect.runPromise(imageController.render(FileContainer.fromImage(data)));
                            }),
                            Match.tag("Error", () => {
                                // TODO: Figure out what to paint when image not found
                            }),
                        )
                    }
                }
            }),
        )
    },[imageResource, jobResource])

    return <ViewBase 
        tall
        action={canDelete ? "delete" : undefined}
        onAction={canDelete ? handleDeleteCandidate : undefined}
    >
        <DeleteJobModal
            jobToDelete={deleteCandidate}
            onCancel={() => setDeleteCandidate()}
            onDelete={handleDelete}
        />
        <Content>
        {
            pipe(
                Match.value(jobResource),
                Match.tag("Error", () => <>Something went wrong</>),
                Match.tag("Loading", () => <Loader />),
                Match.tag("Success", ({ data: job }) => <>
                    <JobInfoContainer>
                        <InfoRow>
                            <div>Job {job.id}</div>
                            <div>Paciente: {job.patientName}</div>
                            <div>Imagen: {job.imageName}</div>
                        </InfoRow>
                        <InfoRow>
                            <Box>
                                <JobStateTag state={job.state} />
                                {capitalize(job.state)}
                            </Box>
                            {pipe(
                                modelResult,
                                Option.map(res => {
                                    return <Box>Macrofagos: {res.detection.length}</Box>
                                }),
                                Option.getOrElse(() => <></>)
                            )}
                            <div>{formatDate(job.updatedAt)}</div>
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