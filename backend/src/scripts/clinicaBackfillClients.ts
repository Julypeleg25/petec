import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

type CliOptions = {
  dryRun: boolean;
  resume: boolean;
  resetNew: boolean;
  clearNewOnly: boolean;
  allClients: boolean;
  plusOnly: boolean;
  detailsOnly: boolean;
  limit?: number;
  fromPage: number;
  delayMs: number;
  batchSize: number;
  mongoUri?: string;
  deadline?: Date;
};

const getArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseNumberArg = (
  name: string,
  fallback?: number,
): number | undefined => {
  const value = getArg(name);

  if (value === undefined) {
    return fallback;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`Invalid --${name}: ${value}`);
  }

  return numberValue;
};

const parseOptions = (): CliOptions => {
  const deadlineMinutes = parseNumberArg("deadline-minutes");

  return {
    dryRun: hasFlag("dry-run"),
    resume: hasFlag("resume"),
    resetNew: hasFlag("reset-new"),
    clearNewOnly: hasFlag("clear-new-only"),
    allClients: !hasFlag("latest-only"),
    plusOnly: hasFlag("plus-only"),
    detailsOnly: hasFlag("details-only"),
    limit: parseNumberArg("limit"),
    fromPage: parseNumberArg("from-page", 1) ?? 1,
    delayMs: parseNumberArg("delay-ms", 1000) ?? 1000,
    batchSize: parseNumberArg("batch-size", 500) ?? 500,
    mongoUri: getArg("mongo-uri") ?? process.env.BACKFILL_MONGODB_URI,
    deadline:
      deadlineMinutes !== undefined
        ? new Date(Date.now() + deadlineMinutes * 60_000)
        : undefined,
  };
};

const main = async (): Promise<void> => {
  const options = parseOptions();
  const [{ ENV }, { runClinicaBackfillClients }] = await Promise.all([
    import("../config/config.js"),
    import("../services/clinicaBackfillClients.service.js"),
  ]);

  console.log("[Clinica Backfill] starting with options:", options);
  console.log(
    `${options.allClients
      ? "[Clinica Backfill] mode: all clients including inactive"
      : "[Clinica Backfill] mode: daily clients list with pagination"}, ${
      options.plusOnly ? "plus rows only" : "opens each row"
    }, ${options.detailsOnly ? "details only" : "client-only fallback enabled"}, new collection only`,
  );

  await mongoose.connect(options.mongoUri ?? ENV.mongoDBUri);

  try {
    const result = await runClinicaBackfillClients(options);

    console.log("[Clinica Backfill] finished:", result);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("[Clinica Backfill] fatal error:", error);
  process.exit(1);
});
