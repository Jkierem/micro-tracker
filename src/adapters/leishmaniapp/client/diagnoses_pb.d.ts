import * as jspb from 'google-protobuf'

import * as model_pb from './model_pb'; // proto import: "model.proto"
import * as types_pb from './types_pb'; // proto import: "types.proto"


export class DiagnosisRequest extends jspb.Message {
  getUuid(): string;
  setUuid(value: string): DiagnosisRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DiagnosisRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DiagnosisRequest): DiagnosisRequest.AsObject;
  static serializeBinaryToWriter(message: DiagnosisRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DiagnosisRequest;
  static deserializeBinaryFromReader(message: DiagnosisRequest, reader: jspb.BinaryReader): DiagnosisRequest;
}

export namespace DiagnosisRequest {
  export type AsObject = {
    uuid: string,
  }
}

export class DiagnosisResponse extends jspb.Message {
  getStatus(): types_pb.StatusResponse | undefined;
  setStatus(value?: types_pb.StatusResponse): DiagnosisResponse;
  hasStatus(): boolean;
  clearStatus(): DiagnosisResponse;

  getDiagnosis(): model_pb.Diagnosis | undefined;
  setDiagnosis(value?: model_pb.Diagnosis): DiagnosisResponse;
  hasDiagnosis(): boolean;
  clearDiagnosis(): DiagnosisResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DiagnosisResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DiagnosisResponse): DiagnosisResponse.AsObject;
  static serializeBinaryToWriter(message: DiagnosisResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DiagnosisResponse;
  static deserializeBinaryFromReader(message: DiagnosisResponse, reader: jspb.BinaryReader): DiagnosisResponse;
}

export namespace DiagnosisResponse {
  export type AsObject = {
    status?: types_pb.StatusResponse.AsObject,
    diagnosis?: model_pb.Diagnosis.AsObject,
  }

  export enum DiagnosisCase { 
    _DIAGNOSIS_NOT_SET = 0,
    DIAGNOSIS = 2,
  }
}

