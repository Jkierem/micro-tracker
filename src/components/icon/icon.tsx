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
} as const

export type IconName = keyof typeof Icons

export const Icon = ({ name }: { name: IconName}) => {
    return <img src={Icons[name]} />
}