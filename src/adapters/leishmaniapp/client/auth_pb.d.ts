import * as jspb from 'google-protobuf'

import * as model_pb from './model_pb'; // proto import: "model.proto"
import * as types_pb from './types_pb'; // proto import: "types.proto"


export class AuthRequest extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): AuthRequest;

  getPassword(): string;
  setPassword(value: string): AuthRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AuthRequest): AuthRequest.AsObject;
  static serializeBinaryToWriter(message: AuthRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthRequest;
  static deserializeBinaryFromReader(message: AuthRequest, reader: jspb.BinaryReader): AuthRequest;
}

export namespace AuthRequest {
  export type AsObject = {
    email: string,
    password: string,
  }
}

export class AuthResponse extends jspb.Message {
  getStatus(): types_pb.StatusResponse | undefined;
  setStatus(value?: types_pb.StatusResponse): AuthResponse;
  hasStatus(): boolean;
  clearStatus(): AuthResponse;

  getToken(): string;
  setToken(value: string): AuthResponse;
  hasToken(): boolean;
  clearToken(): AuthResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AuthResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AuthResponse): AuthResponse.AsObject;
  static serializeBinaryToWriter(message: AuthResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AuthResponse;
  static deserializeBinaryFromReader(message: AuthResponse, reader: jspb.BinaryReader): AuthResponse;
}

export namespace AuthResponse {
  export type AsObject = {
    status?: types_pb.StatusResponse.AsObject,
    token?: string,
  }

  export enum TokenCase { 
    _TOKEN_NOT_SET = 0,
    TOKEN = 2,
  }
}

export class TokenRequest extends jspb.Message {
  getToken(): string;
  setToken(value: string): TokenRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TokenRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TokenRequest): TokenRequest.AsObject;
  static serializeBinaryToWriter(message: TokenRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TokenRequest;
  static deserializeBinaryFromReader(message: TokenRequest, reader: jspb.BinaryReader): TokenRequest;
}

export namespace TokenRequest {
  export type AsObject = {
    token: string,
  }
}

export class TokenPayload extends jspb.Message {
  getIat(): number;
  setIat(value: number): TokenPayload;

  getSpecialist(): model_pb.Specialist | undefined;
  setSpecialist(value?: model_pb.Specialist): TokenPayload;
  hasSpecialist(): boolean;
  clearSpecialist(): TokenPayload;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TokenPayload.AsObject;
  static toObject(includeInstance: boolean, msg: TokenPayload): TokenPayload.AsObject;
  static serializeBinaryToWriter(message: TokenPayload, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TokenPayload;
  static deserializeBinaryFromReader(message: TokenPayload, reader: jspb.BinaryReader): TokenPayload;
}

export namespace TokenPayload {
  export type AsObject = {
    iat: number,
    specialist?: model_pb.Specialist.AsObject,
  }
}

