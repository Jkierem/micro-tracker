import * as jspb from 'google-protobuf'

import * as model_pb from './model_pb'; // proto import: "model.proto"
import * as types_pb from './types_pb'; // proto import: "types.proto"


export class AnalysisRequest extends jspb.Message {
  getMetadata(): model_pb.ImageMetadata | undefined;
  setMetadata(value?: model_pb.ImageMetadata): AnalysisRequest;
  hasMetadata(): boolean;
  clearMetadata(): AnalysisRequest;

  getImage(): types_pb.ImageBytes | undefined;
  setImage(value?: types_pb.ImageBytes): AnalysisRequest;
  hasImage(): boolean;
  clearImage(): AnalysisRequest;

  getSpecialist(): model_pb.Specialist.Record | undefined;
  setSpecialist(value?: model_pb.Specialist.Record): AnalysisRequest;
  hasSpecialist(): boolean;
  clearSpecialist(): AnalysisRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AnalysisRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AnalysisRequest): AnalysisRequest.AsObject;
  static serializeBinaryToWriter(message: AnalysisRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AnalysisRequest;
  static deserializeBinaryFromReader(message: AnalysisRequest, reader: jspb.BinaryReader): AnalysisRequest;
}

export namespace AnalysisRequest {
  export type AsObject = {
    metadata?: model_pb.ImageMetadata.AsObject,
    image?: types_pb.ImageBytes.AsObject,
    specialist?: model_pb.Specialist.Record.AsObject,
  }
}

export class AnalysisResponse extends jspb.Message {
  getStatus(): types_pb.StatusResponse | undefined;
  setStatus(value?: types_pb.StatusResponse): AnalysisResponse;
  hasStatus(): boolean;
  clearStatus(): AnalysisResponse;

  getOk(): model_pb.Sample.WithoutStage | undefined;
  setOk(value?: model_pb.Sample.WithoutStage): AnalysisResponse;
  hasOk(): boolean;
  clearOk(): AnalysisResponse;

  getError(): model_pb.Sample.WithError | undefined;
  setError(value?: model_pb.Sample.WithError): AnalysisResponse;
  hasError(): boolean;
  clearError(): AnalysisResponse;

  getSampleCase(): AnalysisResponse.SampleCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AnalysisResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AnalysisResponse): AnalysisResponse.AsObject;
  static serializeBinaryToWriter(message: AnalysisResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AnalysisResponse;
  static deserializeBinaryFromReader(message: AnalysisResponse, reader: jspb.BinaryReader): AnalysisResponse;
}

export namespace AnalysisResponse {
  export type AsObject = {
    status?: types_pb.StatusResponse.AsObject,
    ok?: model_pb.Sample.WithoutStage.AsObject,
    error?: model_pb.Sample.WithError.AsObject,
  }

  export enum SampleCase { 
    SAMPLE_NOT_SET = 0,
    OK = 2,
    ERROR = 3,
  }
}

