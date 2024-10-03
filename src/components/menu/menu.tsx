import styled from "styled-components"
import { ZLayer } from "../../support/style/z-layer"
import { useOnClickOutside } from "../../support/react/use-on-click-outside"

type MenuProps = {
    $open?: boolean
}

const MenuS = styled.div<MenuProps>`
    position: absolute;
    background-color: white;
    bottom: 6%;
    right: 10%;
    min-width: 100px;
    z-index: ${ZLayer.modal};
    display: ${({ $open }) => $open ? "flex" : "none"};
    flex-direction: column;
    box-sizing: border-box;
    border-radius: 8px;
    border: 1px solid black;
    > * {
        border-bottom: 1px solid black;
        display: flex;
        padding: 16px;
        cursor: pointer;
    }
    
    > *:last-child {
        border-bottom: none;
    }
`

export const Menu = ({ 
    children,
    open,
    setOpen
}: { 
    children: React.ReactNode,
    open: boolean,
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
    const ref = useOnClickOutside<HTMLDivElement>(() => setOpen(false), [setOpen]);

    return <MenuS ref={ref} $open={open}>
        {children}
    </MenuS>
}