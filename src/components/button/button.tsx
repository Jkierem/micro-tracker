import React from "react";
import styled from "styled-components";

type ButtonVariant = "primary" | "secondary";

type ButtonColor = "black" | "green" | "red";

type styledProps = {
    $variant: ButtonVariant,
    $color: ButtonColor,
}

const pickColor = ($color: styledProps["$color"]) => {
    switch($color){
        case "black":
            return "black";
        case "green":
            return "#09AB19";
        case "red":
            return "#BE0F0F";
    }
}

const ButtonStyle = styled.button<styledProps>`
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    font-size: 12px;
    font-family: Arial, Helvetica, sans-serif;
    height: min(80px, 5vh);
    width: min(250px, 25vw);
    box-sizing: border-box;
    border: 1px solid ${({ $color }) => pickColor($color)};
    border-radius: 8px;

    ${({ $variant, $color }) => {
        switch($variant){
            case "primary":
                return `
                    background-color: ${pickColor($color)};
                    color: white;
                `;
            case "secondary":
                return `
                    background-color: white;
                    color: ${pickColor($color)};
                `;
        }
    }};
`;

interface ButtonProps {
    variant: ButtonVariant
    color: ButtonColor;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode
}

export const Button = ({
    variant,
    color,
    onClick,
    children
}: ButtonProps) => {
    return <ButtonStyle
        $variant={variant}
        $color={color}
        onClick={onClick}
        children={children}
    />
}

export declare namespace Button {
    type Event = React.MouseEvent<HTMLButtonElement>;
}

Button.Primary = (props: Omit<ButtonProps, "variant">) => <Button {...props} variant="primary"/>

Button.Secondary = (props: Omit<ButtonProps, "variant">) => <Button {...props} variant="secondary"/>