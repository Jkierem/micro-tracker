import * as jspb from 'google-protobuf'



export class StatusResponse extends jspb.Message {
  getCode(): StatusCode;
  setCode(value: StatusCode): StatusResponse;

  getDescription(): string;
  setDescription(value: string): StatusResponse;
  hasDescription(): boolean;
  clearDescription(): StatusResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StatusResponse): StatusResponse.AsObject;
  static serializeBinaryToWriter(message: StatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusResponse;
  static deserializeBinaryFromReader(message: StatusResponse, reader: jspb.BinaryReader): StatusResponse;
}

export namespace StatusResponse {
  export type AsObject = {
    code: StatusCode,
    description?: string,
  }

  export enum DescriptionCase { 
    _DESCRIPTION_NOT_SET = 0,
    DESCRIPTION = 2,
  }
}

export class ImageBytes extends jspb.Message {
  getData(): Uint8Array | string;
  getData_asU8(): Uint8Array;
  getData_asB64(): string;
  setData(value: Uint8Array | string): ImageBytes;

  getMime(): string;
  setMime(value: string): ImageBytes;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ImageBytes.AsObject;
  static toObject(includeInstance: boolean, msg: ImageBytes): ImageBytes.AsObject;
  static serializeBinaryToWriter(message: ImageBytes, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ImageBytes;
  static deserializeBinaryFromReader(message: ImageBytes, reader: jspb.BinaryReader): ImageBytes;
}

export namespace ImageBytes {
  export type AsObject = {
    data: Uint8Array | string,
    mime: string,
  }
}

export class Coordinates extends jspb.Message {
  getX(): number;
  setX(value: number): Coordinates;

  getY(): number;
  setY(value: number): Coordinates;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Coordinates.AsObject;
  static toObject(includeInstance: boolean, msg: Coordinates): Coordinates.AsObject;
  static serializeBinaryToWriter(message: Coordinates, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Coordinates;
  static deserializeBinaryFromReader(message: Coordinates, reader: jspb.BinaryReader): Coordinates;
}

export namespace Coordinates {
  export type AsObject = {
    x: number,
    y: number,
  }
}

export class ListOfCoordinates extends jspb.Message {
  getCoordinatesList(): Array<Coordinates>;
  setCoordinatesList(value: Array<Coordinates>): ListOfCoordinates;
  clearCoordinatesList(): ListOfCoordinates;
  addCoordinates(value?: Coordinates, index?: number): Coordinates;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ListOfCoordinates.AsObject;
  static toObject(includeInstance: boolean, msg: ListOfCoordinates): ListOfCoordinates.AsObject;
  static serializeBinaryToWriter(message: ListOfCoordinates, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ListOfCoordinates;
  static deserializeBinaryFromReader(message: ListOfCoordinates, reader: jspb.BinaryReader): ListOfCoordinates;
}

export namespace ListOfCoordinates {
  export type AsObject = {
    coordinatesList: Array<Coordinates.AsObject>,
  }
}

export enum StatusCode { 
  UNSPECIFIED = 0,
  OK = 200,
  BAD_REQUEST = 400,
  FORBIDDEN = 403,
  UNAUTHENTICATED = 401,
  NOT_FOUND = 404,
  IM_A_TEAPOD = 418,
  UNPROCESSABLE_CONTENT = 422,
  INVALID_TOKEN = 498,
  INTERNAL_SERVER_ERROR = 500,
}
