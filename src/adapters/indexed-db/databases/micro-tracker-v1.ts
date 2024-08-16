import { DbName, IndexedDB, Version } from "../indexed-db.support";

export const MicroTrackerV1 = IndexedDB.make(
    DbName("micro-tracker"),
    Version(1),
    {
        reports: {
            keyPath: "id",
            autoIncrement: true,
            indexes: ["patientName"],
        },
        images: {
            keyPath: "id",
            autoIncrement: true,
            indexes: ["patientName", "imageName"],
        }
    }
)