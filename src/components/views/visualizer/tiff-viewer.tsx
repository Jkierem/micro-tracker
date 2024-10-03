import styled from "styled-components";
import { ImageLoader } from "../../../services/image-loader.service";
import { Effect, Option, pipe } from "effect";
import { Icon } from "../../icon/icon";

const ProgressBar = styled.div<{ $total: number, $current: number }>`
    position: absolute;
    width: ${({ $current, $total }) => ($current * 100) / $total}%;
    height: 10%;
    background-color: #599BFF;
    top: 0;
    left: 0;
`

const Controls = styled.div`
    height: 37.5%;
    width: 100%;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    & > img {
        height: 18%;
        margin-left: 5%;
        margin-right: 5%;
    }
`

export const TiffViewer = ({
    canvasRef,
    state,
    controller
} : {
    canvasRef: ImageLoader.CanvasRef,
    state: ImageLoader.ImageState,
    controller: ImageLoader.ImageController
}) => {
    const progress = pipe(
        state,
        Option.map(data => {
            return {
                $current: data.current + 1,
                $total: data.slices.length
            }
        }),
        Option.getOrElse(() => ({ $current: 1, $total: 1 }))
    )

    const handleControl = (action: "first" | "previous" | "next" | "last") => () => {
        switch(action){
            case "first":
                controller.update(prev => {
                    return pipe(
                        prev,
                        Option.map(prev => ({ ...prev, current: 0 }))
                    )
                }).pipe(Effect.runPromise);
                break;
            case "last":
                controller.update(prev => {
                    return pipe(
                        prev,
                        Option.map(prev => ({ ...prev, current: prev.slices.length - 1 }))
                    )
                }).pipe(Effect.runPromise);
                break;
            case "previous":
                controller.update(prev => {
                    return pipe(
                        prev,
                        Option.map(prev => {
                            return {
                                ...prev,
                                current: prev.current > 0 ? prev.current - 1 : 0
                            }
                        })
                    )
                }).pipe(Effect.runPromise);
                break;
            case "next":
                controller.update(prev => {
                    return pipe(
                        prev,
                        Option.map(prev => {
                            return {
                                ...prev,
                                current: prev.current < prev.slices.length - 1 
                                    ? prev.current + 1 
                                    : prev.current
                            }
                        })
                    )
                }).pipe(Effect.runPromise);
                break;
        }
    }

    return <>
        <canvas 
            ref={canvasRef} 
            style={{ 
                height: "62.5%", 
                width: "100%" ,
                boxSizing: "border-box"
            }} 
        />
        <Controls>
            <ProgressBar {...progress} />
            <Icon onClick={handleControl("first")} name="first" />
            <Icon onClick={handleControl("previous")} name="previous" />
            <Icon onClick={handleControl("next")} name="next" />
            <Icon onClick={handleControl("last")} name="last" />
        </Controls>
    </>
}