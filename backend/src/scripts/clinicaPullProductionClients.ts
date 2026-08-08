import dotenv from "dotenv";
import mongoose, { type Connection } from "mongoose";
import { ENV } from "../config/config.js";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

type CliOptions = {
  dryRun: boolean;
  overwriteExisting: boolean;
  limit?: number;
};

type PullStats = {
  scanned: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
};

type ClinicaClientDoc = {
  _id?: unknown;
  externalPatientId?: unknown;
  ownerName?: unknown;
  ownerPhone?: unknown;
  pets?: unknown;
  rawData?: unknown;
  lastSyncedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
};

const CLINICA_CLIENTS_COLLECTION = "clinica_clients";

const getArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseOptions = (): CliOptions => {
  const limitValue = getArg("limit");
  const limit = limitValue === undefined ? undefined : Number(limitValue);

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error(`Invalid --limit: ${limitValue}`);
  }

  return {
    dryRun: hasFlag("dry-run"),
    overwriteExisting: hasFlag("overwrite-existing"),
    limit,
  };
};

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const getConnectionName = (uri: string): string => {
  try {
    const parsed = new URL(uri);

    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "unknown";
  }
};

const getMongoUris = () => {
  const sourceUriArg = getArg("source-uri");
  const targetUriArg = getArg("target-uri");
  const sourceUri =
    sourceUriArg ??
    (hasFlag("source-from-config") ? ENV.mongoDBUri : undefined) ??
    process.env.PRODUCTION_MONGODB_URI ?? process.env.PROD_MONGODB_URI;
  const targetUri =
    targetUriArg ??
    process.env.TARGET_MONGODB_URI ??
    process.env.LOCAL_MONGODB_URI ??
    process.env.MONGODB_URI ??
    ENV.mongoDBUri;

  if (!sourceUri) {
    throw new Error(
      "Missing production Mongo URI. Pass --source-uri=... or set PRODUCTION_MONGODB_URI.",
    );
  }

  if (!sourceUri.startsWith("mongodb://") && !sourceUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "Invalid production Mongo URI. Replace PRODUCTION_MONGO_URI with a real mongodb:// or mongodb+srv:// URI.",
    );
  }

  if (!targetUri) {
    throw new Error(
      "Missing target Mongo URI. Pass --target-uri=... or set TARGET_MONGODB_URI, LOCAL_MONGODB_URI, or MONGODB_URI.",
    );
  }

  if (!targetUri.startsWith("mongodb://") && !targetUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "Invalid target Mongo URI. Pass a real mongodb:// or mongodb+srv:// URI.",
    );
  }

  if (sourceUri === targetUri) {
    throw new Error(
      "Source and target Mongo URIs are identical. Refusing to copy production into itself.",
    );
  }

  return { sourceUri, targetUri };
};

const buildClientFilter = (client: ClinicaClientDoc) => {
  const externalPatientId = normalizeText(client.externalPatientId);

  if (externalPatientId) {
    return { externalPatientId };
  }

  return {
    ownerName: normalizeText(client.ownerName),
    ownerPhone: normalizeText(client.ownerPhone),
  };
};

const sanitizeClient = (
  client: ClinicaClientDoc,
): Omit<ClinicaClientDoc, "_id"> | null => {
  const externalPatientId = normalizeText(client.externalPatientId);
  const ownerName = normalizeText(client.ownerName);
  const ownerPhone = normalizeText(client.ownerPhone);

  if (!ownerName || !ownerPhone || !Array.isArray(client.pets)) {
    return null;
  }

  const { _id: _ignoredId, ...rest } = client;

  return {
    ...rest,
    ...(externalPatientId ? { externalPatientId } : {}),
    ownerName,
    ownerPhone,
    pets: client.pets,
    rawData: client.rawData ?? {},
    lastSyncedAt:
      client.lastSyncedAt instanceof Date ? client.lastSyncedAt : new Date(),
  };
};

const closeConnection = async (connection: Connection): Promise<void> => {
  await connection.close().catch(() => undefined);
};

const main = async (): Promise<void> => {
  const options = parseOptions();
  const { sourceUri, targetUri } = getMongoUris();

  console.log("[Clinica Pull Production] starting with options:", options);
  console.log(
    `[Clinica Pull Production] source=${getConnectionName(sourceUri)} target=${getConnectionName(targetUri)}`,
  );

  const sourceConnection = await mongoose.createConnection(sourceUri).asPromise();
  const targetConnection = await mongoose.createConnection(targetUri).asPromise();
  const sourceCollection = sourceConnection.collection<ClinicaClientDoc>(
    CLINICA_CLIENTS_COLLECTION,
  );
  const targetCollection = targetConnection.collection<ClinicaClientDoc>(
    CLINICA_CLIENTS_COLLECTION,
  );
  const stats: PullStats = {
    scanned: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
  };

  try {
    const cursor = sourceCollection
      .find({}, { limit: options.limit ?? 0 })
      .batchSize(100);

    for await (const sourceClient of cursor) {
      stats.scanned += 1;

      try {
        const client = sanitizeClient(sourceClient);

        if (!client) {
          stats.skipped += 1;
          continue;
        }

        const filter = buildClientFilter(client);
        const existing = await targetCollection.findOne(filter, {
          projection: { _id: 1 },
        });

        if (options.dryRun) {
          if (existing) {
            stats.unchanged += 1;
          } else {
            stats.inserted += 1;
          }

          continue;
        }

        if (existing && !options.overwriteExisting) {
          stats.unchanged += 1;
          continue;
        }

        await targetCollection.updateOne(
          filter,
          {
            $set: client,
            $setOnInsert: {
              createdAt: client.createdAt instanceof Date ? client.createdAt : new Date(),
            },
          },
          { upsert: true },
        );

        if (existing) {
          stats.updated += 1;
        } else {
          stats.inserted += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.warn(
          "[Clinica Pull Production] failed client:",
          normalizeText(sourceClient.externalPatientId) ||
            normalizeText(sourceClient.ownerName) ||
            "unknown",
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  } finally {
    await Promise.all([
      closeConnection(sourceConnection),
      closeConnection(targetConnection),
    ]);
  }

  console.log("[Clinica Pull Production] finished:", stats);
};

main().catch((error) => {
  console.error("[Clinica Pull Production] fatal error:", error);
  process.exit(1);
});
