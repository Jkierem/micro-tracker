import styled, { keyframes } from "styled-components";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

export const Loader = styled.div`
    margin-block: auto;
    width: min(60px, 10vh);
    height: min(60px, 10vh);
    background-color: white;
    border: 2px solid black;
    border-radius: 50%;
    border-left: 2px solid white;
    animation: ${rotate} 0.8s linear infinite;
`