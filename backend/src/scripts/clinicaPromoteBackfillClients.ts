import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

type CliOptions = {
  dryRun: boolean;
  minCount: number;
  mongoUri?: string;
};

const getArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseOptions = (): CliOptions => {
  const minCountArg = getArg("min-count");
  const minCount = minCountArg === undefined ? 2000 : Number(minCountArg);

  if (!Number.isFinite(minCount) || minCount < 0) {
    throw new Error(`Invalid --min-count: ${minCountArg}`);
  }

  return {
    dryRun: hasFlag("dry-run"),
    minCount,
    mongoUri: getArg("mongo-uri") ?? process.env.BACKFILL_MONGODB_URI,
  };
};

const main = async (): Promise<void> => {
  const options = parseOptions();
  const [{ ENV }, { clinicaClientService }] = await Promise.all([
    import("../config/config.js"),
    import("../services/clinica/clinicaClient.service.js"),
  ]);

  console.log("[Clinica Promote Backfill] starting with options:", options);

  await mongoose.connect(options.mongoUri ?? ENV.mongoDBUri);

  try {
    const result = await clinicaClientService.promoteBackfillClients({
      minCount: options.minCount,
      dryRun: options.dryRun,
    });

    if (!result.promoted) {
      console.log(
        `[Clinica Promote Backfill] skipped: only ${result.backfillCount} backfill clients found, need at least ${result.minCount}`,
      );
    } else {
      console.log("[Clinica Promote Backfill] finished:", result);
    }
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("[Clinica Promote Backfill] fatal error:", error);
  process.exit(1);
});
