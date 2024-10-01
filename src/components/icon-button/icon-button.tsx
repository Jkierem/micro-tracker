import styled from "styled-components"
import { Icon, IconName } from "../icon/icon"

const Container = styled.button`
    width: min(300px, 15vh);
    height: min(300px, 15vh);
    padding-top: min(50px, 2.5vh);
    padding-bottom: min(50px, 2.5vh);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: 1px solid #000000;
    border-radius: 8px;
    user-select: none;
    cursor: pointer;
`;

const Image = styled.div`
    & img {
        max-height: min(100px, 5vh);
    }
`

const Text = styled.p`
    width: 100%;
    height: min(36px, 12%);
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    font-size: 12px;
    font-family: Arial, Helvetica, sans-serif;
`

interface Props {
    icon: IconName,
    text: string,
    onClick: () => void
}

export const IconButton = ({ icon, text, onClick }: Props) => {
    return <Container onClick={onClick} >
        <Image><Icon name={icon} /></Image>
        <Text>{text}</Text>
    </Container>
}

const Group = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    & > * {
        margin-bottom: min(60px, 4vh);
    }

    & > *:last-child {
        margin-bottom: 0px;
    }
`

IconButton.Group = Group;