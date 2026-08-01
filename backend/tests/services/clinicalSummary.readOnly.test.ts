import fs from "node:fs";
import path from "node:path";

describe("clinical summary read-only boundary", () => {
  it("contains no patient mutation operation", () => {
    const folder = path.resolve(process.cwd(), "src/services/clinicalSummary");
    const source = fs.readdirSync(folder).filter((name) => name.endsWith(".ts"))
      .map((name) => fs.readFileSync(path.join(folder, name), "utf8")).join("\n");
    for (const operation of [
      "updateOne(", "updateMany(", "findOneAndUpdate(", "findByIdAndUpdate(",
      "replaceOne(", "deleteOne(", "deleteMany(", ".save(",
    ]) expect(source).not.toContain(operation);
  });

  it("does not import the patient mutation service", () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), "src/services/clinicalSummary/clinicalSummary.service.ts"), "utf8");
    expect(source).not.toContain("services/patient");
    expect(source).not.toContain("patientService");
  });
});
