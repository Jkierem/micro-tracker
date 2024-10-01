import React from "react"
import styled from "styled-components"
import { ZLayer } from "../../support/style/z-layer"
import { Services } from "../services-provider/services.provider";
import { Effect } from "effect";
import { Icon, IconName } from "../icon/icon";
import { isView, Views } from "../../support/routing/views";

const navitemHeight = `min(200px, 10vh)`;
const gutter = `min(80px, 5vh)`;
const navbarContainerHeight = `calc(${navitemHeight} + ${gutter})`;
const navbarHeight = `calc((${navitemHeight} / 2) + ${gutter})`;

const BaseContainer = styled.div`
    width: 100%;
    height: 100%;
`

const Content = styled.main`
    height: calc(100vh - (${navbarHeight}));
    width: 100%;
`

const NavBarContainer = styled.div`
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: ${ZLayer.navigation};
    height: ${navbarContainerHeight};
`

const NavItem = styled.div<{ $hidden?: boolean }>`
    width: ${navitemHeight};
    height: ${navitemHeight};
    border-radius: 50%;
    background-color: white;
    border: 1px solid black;
    box-sizing: border-box;
    margin-bottom: calc((${navitemHeight} / 2) + ${gutter});
    visibility: ${({ $hidden }) => $hidden ? "hidden" : "visible"};
    display: flex;
    justify-content: center;
    align-items: center;

    & img {
        max-width: min(100px, 5vh);
        max-height: min(100px, 5vh);
    }
`

const NavBar = styled.nav`
    margin-top: calc(${navitemHeight} / 2);
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    height: calc((${navitemHeight} / 2) + ${gutter});
    background-color: black;

    :nth-child(2){
        margin-left: min(5%, 64px);
        margin-right: min(5%, 64px);
    }
`

export type Action = IconName;

type BaseProps = {
    left?: Action,
    center?: Action,
    right?: Action,
    onAction?: (action: Action) => void,
    children?: React.ReactNode
}

const Template = ({
    left,
    center,
    right,
    onAction,
    children
}: BaseProps) => {
    const handleAction = (action?: Action) => () => {
        if( action ){
            onAction?.(action);
        }
    }

    return <BaseContainer>
        <NavBarContainer>
            <NavBar>
                {[left, center, right].map((action, actionIndex) => {
                    return <NavItem 
                        key={`action-${actionIndex}`} 
                        $hidden={!action} 
                        onClick={handleAction(action)}
                    >
                        {action && <Icon name={action} />}
                    </NavItem>
                })}
            </NavBar>
        </NavBarContainer>
        <Content>
            {children}
        </Content>
    </BaseContainer>
}
 
interface DefaultProps {
    children?: React.ReactNode,
    action?: Action,
    onAction?: (action: Action) => void,
    onHome?: () => void,
    onBack?: () => void,
}

export const ViewBase = ({ 
    children,
    action,
    onAction,
    onBack,
    onHome
}: DefaultProps) => {
    const { router } = Services.use();

    const current = router.useCurrentView();

    const isMain = isView(Views.Main())(current);

    const handleHome = () => {
        router.goToMain();
        onHome?.();
    }

    const handleBack = () => {
        router.goBack().pipe(Effect.runSync);
        onBack?.();
    }

    const handleAction = (act: Action) => {
        switch(act){
            case "home":
                return handleHome();
            case "back":
                return handleBack();
            default:
                onAction?.(act);
        }
    }

    const actions = {
        left: isMain ? undefined : "back",
        center: isMain ? undefined : "home",
        right: isMain ? undefined : action
    } as const

    return <Template
        {...actions}
        onAction={handleAction}
    >
        {children}
    </Template>
}

ViewBase.Custom = Template;