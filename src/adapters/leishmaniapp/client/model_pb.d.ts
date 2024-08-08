import * as jspb from 'google-protobuf'

import * as types_pb from './types_pb'; // proto import: "types.proto"


export class Specialist extends jspb.Message {
  getEmail(): string;
  setEmail(value: string): Specialist;

  getName(): string;
  setName(value: string): Specialist;

  getDiseasesList(): Array<string>;
  setDiseasesList(value: Array<string>): Specialist;
  clearDiseasesList(): Specialist;
  addDiseases(value: string, index?: number): Specialist;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Specialist.AsObject;
  static toObject(includeInstance: boolean, msg: Specialist): Specialist.AsObject;
  static serializeBinaryToWriter(message: Specialist, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Specialist;
  static deserializeBinaryFromReader(message: Specialist, reader: jspb.BinaryReader): Specialist;
}

export namespace Specialist {
  export type AsObject = {
    email: string,
    name: string,
    diseasesList: Array<string>,
  }

  export class WithCredentials extends jspb.Message {
    getEmail(): string;
    setEmail(value: string): WithCredentials;

    getName(): string;
    setName(value: string): WithCredentials;

    getPasswordHash(): string;
    setPasswordHash(value: string): WithCredentials;

    getDiseasesList(): Array<string>;
    setDiseasesList(value: Array<string>): WithCredentials;
    clearDiseasesList(): WithCredentials;
    addDiseases(value: string, index?: number): WithCredentials;

    getToken(): string;
    setToken(value: string): WithCredentials;
    hasToken(): boolean;
    clearToken(): WithCredentials;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WithCredentials.AsObject;
    static toObject(includeInstance: boolean, msg: WithCredentials): WithCredentials.AsObject;
    static serializeBinaryToWriter(message: WithCredentials, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WithCredentials;
    static deserializeBinaryFromReader(message: WithCredentials, reader: jspb.BinaryReader): WithCredentials;
  }

  export namespace WithCredentials {
    export type AsObject = {
      email: string,
      name: string,
      passwordHash: string,
      diseasesList: Array<string>,
      token?: string,
    }

    export enum TokenCase { 
      _TOKEN_NOT_SET = 0,
      TOKEN = 5,
    }
  }


  export class Record extends jspb.Message {
    getEmail(): string;
    setEmail(value: string): Record;

    getName(): string;
    setName(value: string): Record;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Record.AsObject;
    static toObject(includeInstance: boolean, msg: Record): Record.AsObject;
    static serializeBinaryToWriter(message: Record, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Record;
    static deserializeBinaryFromReader(message: Record, reader: jspb.BinaryReader): Record;
  }

  export namespace Record {
    export type AsObject = {
      email: string,
      name: string,
    }
  }

}

export class Diagnosis extends jspb.Message {
  getId(): string;
  setId(value: string): Diagnosis;

  getDisease(): string;
  setDisease(value: string): Diagnosis;

  getSpecialist(): Specialist.Record | undefined;
  setSpecialist(value?: Specialist.Record): Diagnosis;
  hasSpecialist(): boolean;
  clearSpecialist(): Diagnosis;

  getPatientHash(): string;
  setPatientHash(value: string): Diagnosis;

  getSamples(): number;
  setSamples(value: number): Diagnosis;

  getDate(): number;
  setDate(value: number): Diagnosis;

  getRemarks(): string;
  setRemarks(value: string): Diagnosis;
  hasRemarks(): boolean;
  clearRemarks(): Diagnosis;

  getResults(): Diagnosis.Results | undefined;
  setResults(value?: Diagnosis.Results): Diagnosis;
  hasResults(): boolean;
  clearResults(): Diagnosis;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Diagnosis.AsObject;
  static toObject(includeInstance: boolean, msg: Diagnosis): Diagnosis.AsObject;
  static serializeBinaryToWriter(message: Diagnosis, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Diagnosis;
  static deserializeBinaryFromReader(message: Diagnosis, reader: jspb.BinaryReader): Diagnosis;
}

export namespace Diagnosis {
  export type AsObject = {
    id: string,
    disease: string,
    specialist?: Specialist.Record.AsObject,
    patientHash: string,
    samples: number,
    date: number,
    remarks?: string,
    results?: Diagnosis.Results.AsObject,
  }

  export class Results extends jspb.Message {
    getSpecialistResult(): boolean;
    setSpecialistResult(value: boolean): Results;

    getSpecialistElementsMap(): jspb.Map<string, number>;
    clearSpecialistElementsMap(): Results;

    getModelResult(): boolean;
    setModelResult(value: boolean): Results;

    getModelElementsMap(): jspb.Map<string, number>;
    clearModelElementsMap(): Results;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Results.AsObject;
    static toObject(includeInstance: boolean, msg: Results): Results.AsObject;
    static serializeBinaryToWriter(message: Results, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Results;
    static deserializeBinaryFromReader(message: Results, reader: jspb.BinaryReader): Results;
  }

  export namespace Results {
    export type AsObject = {
      specialistResult: boolean,
      specialistElementsMap: Array<[string, number]>,
      modelResult: boolean,
      modelElementsMap: Array<[string, number]>,
    }
  }


  export enum RemarksCase { 
    _REMARKS_NOT_SET = 0,
    REMARKS = 7,
  }
}

export class ImageMetadata extends jspb.Message {
  getDiagnosis(): string;
  setDiagnosis(value: string): ImageMetadata;

  getSample(): number;
  setSample(value: number): ImageMetadata;

  getDisease(): string;
  setDisease(value: string): ImageMetadata;

  getDate(): number;
  setDate(value: number): ImageMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ImageMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: ImageMetadata): ImageMetadata.AsObject;
  static serializeBinaryToWriter(message: ImageMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ImageMetadata;
  static deserializeBinaryFromReader(message: ImageMetadata, reader: jspb.BinaryReader): ImageMetadata;
}

export namespace ImageMetadata {
  export type AsObject = {
    diagnosis: string,
    sample: number,
    disease: string,
    date: number,
  }
}

export class Sample extends jspb.Message {
  getMetadata(): ImageMetadata | undefined;
  setMetadata(value?: ImageMetadata): Sample;
  hasMetadata(): boolean;
  clearMetadata(): Sample;

  getStage(): AnalysisStage;
  setStage(value: AnalysisStage): Sample;

  getSpecialist(): Specialist.Record | undefined;
  setSpecialist(value?: Specialist.Record): Sample;
  hasSpecialist(): boolean;
  clearSpecialist(): Sample;

  getResultsMap(): jspb.Map<string, types_pb.ListOfCoordinates>;
  clearResultsMap(): Sample;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Sample.AsObject;
  static toObject(includeInstance: boolean, msg: Sample): Sample.AsObject;
  static serializeBinaryToWriter(message: Sample, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Sample;
  static deserializeBinaryFromReader(message: Sample, reader: jspb.BinaryReader): Sample;
}

export namespace Sample {
  export type AsObject = {
    metadata?: ImageMetadata.AsObject,
    stage: AnalysisStage,
    specialist?: Specialist.Record.AsObject,
    resultsMap: Array<[string, types_pb.ListOfCoordinates.AsObject]>,
  }

  export class WithoutStage extends jspb.Message {
    getMetadata(): ImageMetadata | undefined;
    setMetadata(value?: ImageMetadata): WithoutStage;
    hasMetadata(): boolean;
    clearMetadata(): WithoutStage;

    getSpecialist(): Specialist.Record | undefined;
    setSpecialist(value?: Specialist.Record): WithoutStage;
    hasSpecialist(): boolean;
    clearSpecialist(): WithoutStage;

    getResultsMap(): jspb.Map<string, types_pb.ListOfCoordinates>;
    clearResultsMap(): WithoutStage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WithoutStage.AsObject;
    static toObject(includeInstance: boolean, msg: WithoutStage): WithoutStage.AsObject;
    static serializeBinaryToWriter(message: WithoutStage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WithoutStage;
    static deserializeBinaryFromReader(message: WithoutStage, reader: jspb.BinaryReader): WithoutStage;
  }

  export namespace WithoutStage {
    export type AsObject = {
      metadata?: ImageMetadata.AsObject,
      specialist?: Specialist.Record.AsObject,
      resultsMap: Array<[string, types_pb.ListOfCoordinates.AsObject]>,
    }
  }


  export class WithError extends jspb.Message {
    getMetadata(): ImageMetadata | undefined;
    setMetadata(value?: ImageMetadata): WithError;
    hasMetadata(): boolean;
    clearMetadata(): WithError;

    getSpecialist(): Specialist.Record | undefined;
    setSpecialist(value?: Specialist.Record): WithError;
    hasSpecialist(): boolean;
    clearSpecialist(): WithError;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): WithError.AsObject;
    static toObject(includeInstance: boolean, msg: WithError): WithError.AsObject;
    static serializeBinaryToWriter(message: WithError, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): WithError;
    static deserializeBinaryFromReader(message: WithError, reader: jspb.BinaryReader): WithError;
  }

  export namespace WithError {
    export type AsObject = {
      metadata?: ImageMetadata.AsObject,
      specialist?: Specialist.Record.AsObject,
    }
  }

}

export enum AnalysisStage { 
  ERROR = 0,
  ERROR_DELIVER = 1,
  ANALYZING = 2,
  DELIVER = 3,
  ANALYZED = 4,
}
