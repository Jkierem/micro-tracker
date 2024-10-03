import home from "../../assets/icons/home.svg";
import leftArrow from "../../assets/icons/left-arrow.svg";
import close from "../../assets/icons/close.svg";
import ellipsis from "../../assets/icons/ellipsis.svg";
import trash from "../../assets/icons/trash.svg";
import camera from "../../assets/icons/camera.svg";
import picture from "../../assets/icons/picture.svg";
import document from "../../assets/icons/document.svg";
import logout from "../../assets/icons/logout.svg";
import upload from "../../assets/icons/upload.svg";
import caretLeft from "../../assets/icons/caret-left.svg";
import caretRight from "../../assets/icons/caret-right.svg";
import tripleCaretLeft from "../../assets/icons/triple-caret-left.svg";
import tripleCaretRight from "../../assets/icons/tripple-caret-right.svg";
import React from "react";

const Icons = {
    camera,
    picture,
    gallery: picture,
    document,
    reports: document,
    home,
    back: leftArrow,
    "left-arrow": leftArrow,
    close,
    "small-x": close,
    ellipsis,
    menu: ellipsis,
    trash,
    delete: trash,
    logout,
    upload,
    caretLeft,
    previous: caretLeft,
    caretRight,
    next: caretRight,
    tripleCaretLeft,
    first: tripleCaretLeft,
    tripleCaretRight,
    last: tripleCaretRight,
} as const

export type IconName = keyof typeof Icons

export declare namespace Icon {
    type Event = React.MouseEvent<HTMLImageElement>;
}

export const Icon = ({ name, onClick }: { name: IconName, onClick?: (e: Icon.Event) => void }) => {
    return <img src={Icons[name]} onClick={onClick} />
}