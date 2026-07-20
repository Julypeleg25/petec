import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

type CliOptions = {
  dryRun: boolean;
  delayMs: number;
  fromPage: number;
  mongoUri?: string;
};

const getArg = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));

  return arg?.slice(prefix.length);
};

const hasFlag = (name: string): boolean => process.argv.includes(`--${name}`);

const parseOptions = (): CliOptions => ({
  dryRun: hasFlag("dry-run"),
  delayMs: Number(getArg("delay-ms") ?? 800),
  fromPage: Number(getArg("from-page") ?? 1),
  mongoUri: getArg("mongo-uri") ?? process.env.BACKFILL_MONGODB_URI,
});

const main = async (): Promise<void> => {
  const options = parseOptions();
  const [{ ENV }, { runClinicaListOnlyBackfill }] = await Promise.all([
    import("../config/config.js"),
    import("../services/clinicaBackfillClients.service.js"),
  ]);

  console.log("[Clinica List-Only Backfill] starting with options:", options);

  await mongoose.connect(options.mongoUri ?? ENV.mongoDBUri);

  try {
    const result = await runClinicaListOnlyBackfill(options);

    console.log("[Clinica List-Only Backfill] finished:", result);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((error) => {
  console.error("[Clinica List-Only Backfill] fatal error:", error);
  process.exit(1);
});
