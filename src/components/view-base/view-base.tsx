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
    position: relative;
    height: calc(100vh - (${navbarHeight}));
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
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

export declare namespace ViewBase {
    type Event = React.MouseEvent<HTMLDivElement>
}

type BaseProps = {
    left?: Action,
    center?: Action,
    right?: Action,
    onAction?: (action: Action, e: ViewBase.Event) => void,
    children?: React.ReactNode
}

const Template = ({
    left,
    center,
    right,
    onAction,
    children
}: BaseProps) => {
    const handleAction = (action?: Action) => (e: ViewBase.Event) => {
        e.stopPropagation();
        if( action ){
            onAction?.(action, e);
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
    onAction?: (action: Action, e: ViewBase.Event) => void,
    onHome?: (e: ViewBase.Event) => void,
    onBack?: (e: ViewBase.Event) => void,
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

    const handleHome = (e: ViewBase.Event) => {
        router.goToMain();
        onHome?.(e);
    }

    const handleBack = (e: ViewBase.Event) => {
        router.goBack().pipe(Effect.runSync);
        onBack?.(e);
    }

    const handleAction = (act: Action, e: ViewBase.Event) => {
        switch(act){
            case "home":
                return handleHome(e);
            case "back":
                return handleBack(e);
            default:
                onAction?.(act, e);
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