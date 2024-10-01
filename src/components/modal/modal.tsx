import React, { useEffect, useRef } from "react"
import styled from "styled-components"
import { ZLayer } from "../../support/style/z-layer"

const Container = styled.dialog`
    border-radius: 12px;
    padding: 1rem;
    z-index: ${ZLayer.modal};
    border: 1px solid white;
    width: min(70%, 300px);
    max-width: 70%;
    box-sizing: border-box;

    &::backdrop {
        background-color: black;
        opacity: 0.6;
    }

    &[open]{
        display: flex;
        flex-direction: column;
        position: absolute;
    }
`

interface Props {
    open?: boolean,
    onClose?: () => void,
    children: React.ReactNode
}

export const Modal = ({
    open, 
    onClose,
    children
}: Props) => {
    const modalRef = useRef<HTMLDialogElement>(null);
    const prevStateRef = useRef<boolean>(open ?? false);

    useEffect(() => {
        if( open ){
            if( !prevStateRef.current ){
                modalRef.current?.showModal()
            }
        } else {
            if( prevStateRef.current ){
                modalRef.current?.close();
            }
        }
        prevStateRef.current = open ?? false;
    },[open])

    return <Container 
        ref={modalRef} 
        onClose={onClose}
        autoFocus
    >
        {children}
    </Container>
}