import styled from "styled-components";
import { Services } from "../services-provider/services.provider"

const Container = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
`

const RouteButton = styled.button`
    margin-bottom: 16px;
    cursor: pointer;
    ${({ disabled }) => disabled && "cursor: not-allowed;"}
`

export const MainMenu = () => {
    const { router } = Services.use();

    return <Container>
        <RouteButton onClick={() => router.goToImageViewer()}>View Tiff</RouteButton>
        <RouteButton onClick={() => router.goToGallery()}>Browse Gallery</RouteButton>
        <RouteButton onClick={() => router.goToCamera()}>Capture Image</RouteButton>
        <RouteButton onClick={() => router.goToTest()}>Test Python</RouteButton>
        <RouteButton disabled onClick={() => router.goToArchive()}>Browse Reports</RouteButton>
    </Container>
}