import { Match, Option, pipe } from "effect";
import { Services } from "../../services-provider/services.provider"
import { navitemHeight, ViewBase } from "../../view-base/view-base"
import styled from "styled-components";
import { JobRepo } from "../../../adapters/job.repository";
import { capitalize } from "effect/String";
import { useCallback } from "react";

const Content = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    padding: min(20px, 10%);
    box-sizing: border-box;
    overflow-y: scroll;
    overflow-x: hidden;
    padding-bottom: calc((${navitemHeight} / 2) + 1px);
`

const Row = styled.div`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    min-height: min(10%, 40px);
    padding: min(10%, 5px);
    font-family: Arial, Helvetica, sans-serif;
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 12px;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`

const Tag = styled.div<{ $color: string }>`
    height: 50%;
    width: 20px;
    border-radius: 4px;
    background-color: ${({ $color }) => $color};
    transition: background-color 1s;
    box-sizing: border-box;
    margin-right: 3%;
`

export const JobStateTag = ({ state }: { state: JobRepo.JobState }) => {
    const color = pipe(
        Match.value(state),
        Match.when("waiting", () => "gray"),
        Match.when("running", () => "orange"),
        Match.when("error", () => "red"),
        Match.when("finished", () => "green"),
        Match.exhaustive
    )

    return <Tag $color={color}></Tag>
}

const JobRow = ({ job, onSelect }: { job: JobRepo.Job, onSelect: (id: JobRepo.JobId) => void }) => {
    const { images } = Services.use();

    const [image] = images.useImage(() => Option.some({ id: job.imageId }), [job.imageId]);

    if( image._tag === "Loading" ){
        return <div>Loading...</div>;
    }

    if( image._tag === "Error" ){
        return <div>Error fetching image data for imageId {job.imageId}</div>
    }

    return <Row key={job.id} onClick={e => {
        e.stopPropagation()
        onSelect(job.id);
    }}>
        <div>Image: {image.data.imageName}</div>
        <div>Patient: {image.data.patientName}</div>
        <div>{capitalize(job.state)}</div>
        <JobStateTag state={job.state}/>
    </Row>
}

export const Jobs = () => {
    const { worker, router  } = Services.use();

    const [jobView] = worker.useQueueView();

    const handleSelect = useCallback((id: JobRepo.JobId) => {
        router.goToReport({ data: id });
    },[router])

    return <ViewBase>
        <Content>
        {
            pipe(
                Match.value(jobView.getJobs()),
                Match.tag("None", () => <>Loading...</>),
                Match.tag("Some", ({ value }) => {
                    return value.map(job => {
                        return <JobRow 
                            key={job.id} 
                            job={job} 
                            onSelect={handleSelect}
                        />
                    })
                }),
                Match.exhaustive
            )
        }
        </Content>
    </ViewBase>
}