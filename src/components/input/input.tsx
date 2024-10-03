import React from "react"
import styled from "styled-components"

const Styled = styled.input<{ $wide?: boolean }>`
    display: flex;
    font-weight: 500;
    font-size: 12px;
    font-family: Arial, Helvetica, sans-serif;
    padding: min(24px, 3vw);
    margin-bottom: min(24px, 2.5vw);
    border-radius: 8px;
    border: 1px solid black;
    ${({ $wide }) => $wide ? "width: 100%;" : ""}
    position: relative;
    box-sizing: border-box;

`

interface InputProps {
    value?: string,
    placeholder?: string,
    wide?: boolean
    onChange: (next: string) => void
}

export const Input = ({
    value,
    placeholder,
    wide,
    onChange
}: InputProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }

    return <Styled $wide={wide} placeholder={placeholder} value={value ?? ""} onChange={handleChange} />
}