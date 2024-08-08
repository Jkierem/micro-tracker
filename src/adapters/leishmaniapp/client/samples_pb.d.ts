import * as jspb from 'google-protobuf'

import * as model_pb from './model_pb'; // proto import: "model.proto"
import * as types_pb from './types_pb'; // proto import: "types.proto"


export class ImageSampleRequest extends jspb.Message {
  getSample(): model_pb.Sample | undefined;
  setSample(value?: model_pb.Sample): ImageSampleRequest;
  hasSample(): boolean;
  clearSample(): ImageSampleRequest;

  getImage(): types_pb.ImageBytes | undefined;
  setImage(value?: types_pb.ImageBytes): ImageSampleRequest;
  hasImage(): boolean;
  clearImage(): ImageSampleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ImageSampleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ImageSampleRequest): ImageSampleRequest.AsObject;
  static serializeBinaryToWriter(message: ImageSampleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ImageSampleRequest;
  static deserializeBinaryFromReader(message: ImageSampleRequest, reader: jspb.BinaryReader): ImageSampleRequest;
}

export namespace ImageSampleRequest {
  export type AsObject = {
    sample?: model_pb.Sample.AsObject,
    image?: types_pb.ImageBytes.AsObject,
  }
}

export class SampleRequest extends jspb.Message {
  getDiagnosis(): string;
  setDiagnosis(value: string): SampleRequest;

  getSample(): number;
  setSample(value: number): SampleRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SampleRequest): SampleRequest.AsObject;
  static serializeBinaryToWriter(message: SampleRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleRequest;
  static deserializeBinaryFromReader(message: SampleRequest, reader: jspb.BinaryReader): SampleRequest;
}

export namespace SampleRequest {
  export type AsObject = {
    diagnosis: string,
    sample: number,
  }
}

export class SampleResponse extends jspb.Message {
  getStatus(): types_pb.StatusResponse | undefined;
  setStatus(value?: types_pb.StatusResponse): SampleResponse;
  hasStatus(): boolean;
  clearStatus(): SampleResponse;

  getSample(): model_pb.Sample | undefined;
  setSample(value?: model_pb.Sample): SampleResponse;
  hasSample(): boolean;
  clearSample(): SampleResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SampleResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SampleResponse): SampleResponse.AsObject;
  static serializeBinaryToWriter(message: SampleResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SampleResponse;
  static deserializeBinaryFromReader(message: SampleResponse, reader: jspb.BinaryReader): SampleResponse;
}

export namespace SampleResponse {
  export type AsObject = {
    status?: types_pb.StatusResponse.AsObject,
    sample?: model_pb.Sample.AsObject,
  }

  export enum SampleCase { 
    _SAMPLE_NOT_SET = 0,
    SAMPLE = 2,
  }
}

export class UndeliveredRequest extends jspb.Message {
  getSpecialist(): string;
  setSpecialist(value: string): UndeliveredRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UndeliveredRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UndeliveredRequest): UndeliveredRequest.AsObject;
  static serializeBinaryToWriter(message: UndeliveredRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UndeliveredRequest;
  static deserializeBinaryFromReader(message: UndeliveredRequest, reader: jspb.BinaryReader): UndeliveredRequest;
}

export namespace UndeliveredRequest {
  export type AsObject = {
    specialist: string,
  }
}

export class UndeliveredResponse extends jspb.Message {
  getStatus(): types_pb.StatusResponse | undefined;
  setStatus(value?: types_pb.StatusResponse): UndeliveredResponse;
  hasStatus(): boolean;
  clearStatus(): UndeliveredResponse;

  getSamplesList(): Array<model_pb.Sample>;
  setSamplesList(value: Array<model_pb.Sample>): UndeliveredResponse;
  clearSamplesList(): UndeliveredResponse;
  addSamples(value?: model_pb.Sample, index?: number): model_pb.Sample;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UndeliveredResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UndeliveredResponse): UndeliveredResponse.AsObject;
  static serializeBinaryToWriter(message: UndeliveredResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UndeliveredResponse;
  static deserializeBinaryFromReader(message: UndeliveredResponse, reader: jspb.BinaryReader): UndeliveredResponse;
}

export namespace UndeliveredResponse {
  export type AsObject = {
    status?: types_pb.StatusResponse.AsObject,
    samplesList: Array<model_pb.Sample.AsObject>,
  }
}

