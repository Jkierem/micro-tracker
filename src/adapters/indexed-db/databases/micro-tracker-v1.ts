import { DbName, IndexedDB, Version } from "../indexed-db.support";

export const MicroTrackerV1 = IndexedDB.make(
    DbName("micro-tracker"),
    Version(2),
    {
        images: {
            keyPath: "id",
            autoIncrement: true,
            indexes: ["patientName", "imageName"],
        },
        jobs: {
            keyPath: "id",
            autoIncrement: true,
            indexes: ["imageId"]
        },
        results: {
            keyPath: "id",
            autoIncrement: true,
            indexes: ["jobId"]
        }
    }
)