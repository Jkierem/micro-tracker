import styled from "styled-components"
import { ViewBase } from "../../view-base/view-base"
import { IconButton } from "../../icon-button/icon-button"
import { Services } from "../../services-provider/services.provider"
import { Effect } from "effect"

const Container = styled.div`
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
`

export const NotFound = () => {
    const { router } = Services.use()

    const handleBack = () => {
        router.goBack().pipe(Effect.runPromise)
    }

    const handleHome = () => {
        router.goToMain()
    }

    return <ViewBase>
        <Container>
            <IconButton.Group>
                <h1>Page Not Found</h1>
                <IconButton icon="left-arrow" text="Ir Atras" onClick={handleBack}/>
                <IconButton icon="home" text="Ir a Inicio" onClick={handleHome}/>
            </IconButton.Group>
        </Container>
    </ViewBase>
}