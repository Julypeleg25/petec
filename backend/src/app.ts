import express from "express";
import { ENV } from "@config/config";
import connectToDatabase from "@db/dbConnection";

const app = express();
const PORT = ENV.port;

await connectToDatabase().catch((error) => {
  console.error("Failed to connect to the database:", error);
  process.exit(1);
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
