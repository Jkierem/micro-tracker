type Size = {
    readonly width: number,
    readonly height: number
}

class MediaElement implements Size {
    readonly width: number;
    readonly height: number;

    private constructor(
        readonly data: HTMLVideoElement | ImageBitmap
    ){
        if( "videoHeight" in data ){
            this.height = data.videoHeight;
            this.width = data.videoWidth;
        } else {
            this.height = data.height;
            this.width = data.width;
        }
    }

    public static make(media: HTMLVideoElement | ImageBitmap){
        return new MediaElement(media);
    }
}

function calculateSize(srcSize: Size, dstSize: Size) {
    const srcRatio = srcSize.width / srcSize.height;
    const dstRatio = dstSize.width / dstSize.height;
    if (dstRatio > srcRatio) {
      return {
        width:  dstSize.height * srcRatio,
        height: dstSize.height
      };
    } else {
      return {
        width:  dstSize.width,
        height: dstSize.width / srcRatio
      };
    }
}

export type Offset = {
    xOffset: number,
    yOffset: number,
}

export class CanvasUtilities {
    public static paint (
        canvas: HTMLCanvasElement | OffscreenCanvas,
        context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        resource: HTMLVideoElement | ImageBitmap
    ) {
        const media = MediaElement.make(resource);
        canvas.width = media.width;
        canvas.height = media.height;
        context.clearRect(0,0,canvas.width,canvas.height);
        context.drawImage(
            media.data, 
            0, 0, media.width, media.height,
            0, 0, canvas.width, canvas.height
        );
    }

    public static paintWithAspectRatio(
        canvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D,
        resource: HTMLVideoElement | ImageBitmap,
    ): Offset {
        const media = MediaElement.make(resource);
        canvas.width = canvas.scrollWidth;
        canvas.height = canvas.scrollHeight;
        const renderSize = calculateSize(media, canvas);
        const xOffset = (canvas.width - renderSize.width) / 2;
        const yOffset = (canvas.height - renderSize.height) / 2
        context.fillStyle = "rgb(0,0,0)";
        context.fillRect(0,0,canvas.width, canvas.height);
        context.drawImage(media.data, xOffset, yOffset, renderSize.width, renderSize.height);
        return {
            xOffset,
            yOffset
        }
    }
}