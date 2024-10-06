import React from "react"
import styled from "styled-components"
import { ZLayer } from "../../support/style/z-layer"
import { Services } from "../services-provider/services.provider";
import { Effect } from "effect";
import { Icon, IconName } from "../icon/icon";
import { isView, Views } from "../../support/routing/views";

export const navitemHeight = `min(200px, 10vh)`;
const gutter = `min(80px, 5vh)`;
const navbarContainerHeight = `calc(${navitemHeight} + ${gutter})`;
const navbarHeight = `calc((${navitemHeight} / 2) + ${gutter})`;

const BaseContainer = styled.div`
    width: 100%;
    height: 100%;
`

const Content = styled.main<{ $tall?: boolean }>`
    position: relative;
    height: calc(100vh - (${navbarHeight}));
    ${({ $tall }) => $tall &&`height: calc(100vh - (${navitemHeight} + (${gutter} * 2)));`}
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`

const NavBarContainer = styled.div<{ $tall?: boolean }>`
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: ${ZLayer.navigation};
    height: ${navbarContainerHeight};
    ${({ $tall }) => $tall && `height: calc(${navitemHeight} + (${gutter} * 2));`}
`

const NavItem = styled.div<{ $hidden?: boolean, $tall?: boolean }>`
    width: ${navitemHeight};
    height: ${navitemHeight};
    border-radius: 50%;
    background-color: white;
    border: 1px solid black;
    box-sizing: border-box;
    margin-bottom: calc((${navitemHeight} / 2) + ${gutter});
    ${({ $tall }) => $tall && "margin-bottom: 0;"}
    visibility: ${({ $hidden }) => $hidden ? "hidden" : "visible"};
    display: flex;
    justify-content: center;
    align-items: center;

    & img {
        max-width: min(100px, 5vh);
        max-height: min(100px, 5vh);
    }
`

const NavBar = styled.nav<{ $tall?: boolean }>`
    margin-top: calc(${navitemHeight} / 2);
    ${({ $tall }) => $tall && "margin-top: 0;"}
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    height: calc((${navitemHeight} / 2) + ${gutter});
    ${({ $tall }) => $tall && "height: 100%;"}
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
    tall?:boolean,
    onAction?: (action: Action, e: ViewBase.Event) => void,
    children?: React.ReactNode
}

const Template = ({
    left,
    center,
    right,
    tall,
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
        <NavBarContainer $tall={tall}>
            <NavBar $tall={tall}>
                {[left, center, right].map((action, actionIndex) => {
                    return <NavItem 
                        key={`action-${actionIndex}`} 
                        $hidden={!action} 
                        $tall={tall}
                        onClick={handleAction(action)}
                    >
                        {action && <Icon name={action} />}
                    </NavItem>
                })}
            </NavBar>
        </NavBarContainer>
        <Content $tall={tall}>
            {children}
        </Content>
    </BaseContainer>
}
 
interface DefaultProps {
    children?: React.ReactNode,
    tall?: boolean,
    action?: Action,
    onAction?: (action: Action, e: ViewBase.Event) => void,
    onHome?: (e: ViewBase.Event) => void,
    onBack?: (e: ViewBase.Event) => void,
}

export const ViewBase = ({ 
    children,
    action,
    tall,
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
        tall={tall}
        onAction={handleAction}
    >
        {children}
    </Template>
}

ViewBase.Custom = Template;