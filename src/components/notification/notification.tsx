import { Option } from "effect"
import { Modal } from "../modal/modal"
import { Button } from "../button/button"
import { useCallback } from "react"
import { useOptional } from "../../support/effect/use-optional"

type Props = {
    message: Option.Option<string>
    onClose: () => void
}

export const useNotification = () => useOptional<string>();

export const Notification = ({
    message,
    onClose
}: Props) => {
    const handleClose = useCallback((e: Button.Event) => {
        e.stopPropagation();
        onClose();
    },[onClose]);

    return <Modal open={Option.isSome(message)}>
        <h1>{message.pipe(Option.getOrElse<string>(() => ""))}</h1>
        <Button.Primary color="green" onClick={handleClose}>Ok</Button.Primary>
    </Modal>
}