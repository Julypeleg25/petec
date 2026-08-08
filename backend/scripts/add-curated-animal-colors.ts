import mongoose from "mongoose";
import { ENV } from "../src/config/config.js";
import { AnimalColorModel } from "../src/models/lookups/Lookups.js";

const curatedColors = [
  "אדום",
  "אדמדם",
  "אפור בהיר",
  "אפור כהה",
  "אפור חום",
  "אפור כחול",
  "אפור כסוף",
  "אפור לבן",
  "אפור מנומר",
  "אפור מנומר לבן",
  "אפור שחור",
  "אפור שחור לבן",
  "אפרסק",
  "בז'",
  "בז' אפור",
  "בז' חום",
  "בז' לבן",
  "בז' שחור",
  "בלונד",
  "ברונזה",
  "ברינדל",
  "ג'ינג'י חום",
  "ג'ינג'י לבן",
  "ג'ינג'י מנומר",
  "ג'ינג'י שחור",
  "דבש",
  "ורוד",
  "זהוב",
  "חום אדמדם",
  "חום אפור",
  "חום בהיר",
  "חום בז'",
  "חום ג'ינג'י",
  "חום דבש",
  "חום זהוב",
  "חום כהה",
  "חום כתום",
  "חום לבן",
  "חום מנומר",
  "חום מפוספס",
  "חום קרמל",
  "חום שוקולד",
  "חום שחור לבן",
  "כחול",
  "כסוף",
  "כתום",
  "לבן אפור",
  "לבן בז'",
  "לבן ג'ינג'י",
  "לבן כחול",
  "לבן כתום",
  "לבן מנומר",
  "לבן שמנת",
  "לילך",
  "מוקה",
  "מנומר",
  "מפוספס",
  "צהוב",
  "קינמון",
  "קפה",
  "קרם",
  "קרם חום",
  "קרם לבן",
  "קרם שחור",
  "קרמל",
  "שוקולד",
  "שמנת",
  "שמנת שחור",
  "שנהב",
  "תכלת",
] as const;

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

await mongoose.connect(ENV.mongoDBUri);
try {
  const added: string[] = [];
  const restored: string[] = [];
  const existing: string[] = [];

  for (const name of curatedColors) {
    const match = await AnimalColorModel.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "iu"),
    });
    if (!match) {
      await AnimalColorModel.create({ name, isDeleted: false });
      added.push(name);
    } else if (match.isDeleted) {
      match.isDeleted = false;
      await match.save();
      restored.push(name);
    } else {
      existing.push(name);
    }
  }

  console.log(JSON.stringify({ added, restored, existing }, null, 2));
} finally {
  await mongoose.disconnect();
}
