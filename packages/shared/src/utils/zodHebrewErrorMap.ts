import { z } from "zod";

export function setupHebrewZodErrorMap() {
    z.setErrorMap((issue) => {
        let message = "קלט לא תקין";

        if (issue.code === "invalid_type") {
            message = issue.received === "undefined" ? "שדה חובה" : "הערך שהוזן אינו תקין";
        } else if (issue.code === "too_small") {
            if (issue.origin === "array") {
                message = `חייב להכיל לפחות ${issue.minimum} פריטים`;
            } else if (issue.origin === "string") {
                message = issue.minimum === 1 ? "שדה חובה" : `חייב להכיל לפחות ${issue.minimum} תווים`;
            } else if (issue.origin === "number") {
                message = `חייב להיות גדול מ${issue.inclusive ? " או שווה ל" : ""}${issue.minimum}`;
            }
        } else if (issue.code === "too_big") {
            if (issue.origin === "array") {
                message = `חייב להכיל לכל היותר ${issue.maximum} פריטים`;
            } else if (issue.origin === "string") {
                message = `חייב להכיל לכל היותר ${issue.maximum} תווים`;
            } else if (issue.origin === "number") {
                message = `חייב להיות קטן מ${issue.inclusive ? " או שווה ל" : ""}${issue.maximum}`;
            }
        } else if (issue.code === "invalid_format") {
            message = "מחרוזת לא תקינה";
            if (issue.format === "email") {
                message = "כתובת מייל לא תקינה";
            }
        }

        return { message };
    });
}
