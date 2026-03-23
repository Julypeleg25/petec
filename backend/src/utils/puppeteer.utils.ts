import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { logger } from "../config/logger.js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_FILE_EXTENSION = ".pdf";

export const createPdf = async <T extends Record<string, string | number | boolean | undefined | null>>(
    templateFile: string,
    data: T,
    outputFileName: string
): Promise<string> => {
    let pdfPath = "";
    try {
        const normalizedOutputFileName =
            path.extname(outputFileName).toLowerCase() === PDF_FILE_EXTENSION
                ? outputFileName
                : `${outputFileName}${PDF_FILE_EXTENSION}`;
        const templatePath = path.join(__dirname, "..", "templates", templateFile);
        const templateContent = fs.readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(templateContent);
        const htmlContent = template(data);

        const isProduction = process.env.NODE_ENV === "production";
        const browser = await puppeteer.launch(
            isProduction
                ? {
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                    headless: true,
                    executablePath: "/usr/bin/google-chrome",
                    timeout: 60000,
                }
                : {
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                    headless: true,
                    timeout: 60000,
                },
        );

        const page = await browser.newPage();
        await page.setContent(htmlContent, {
            waitUntil: "networkidle0",
            timeout: 60000,
        });

        let relativeScale = 1;
        if (process.env.NODE_ENV !== "test") {
            const contentHeight = await page.evaluate(() => {
                const body = document.body;
                const html = document.documentElement;
                return Math.max(
                    body.scrollHeight,
                    body.offsetHeight,
                    html.clientHeight,
                    html.scrollHeight,
                    html.offsetHeight
                );
            });

            const pageHeight = 846;
            relativeScale = contentHeight - pageHeight < 0 ? 1 : pageHeight / contentHeight;
        }

        pdfPath = path.join(__dirname, normalizedOutputFileName);

        await page.pdf({
            path: pdfPath,
            format: "A4",
            landscape: true,
            printBackground: true,
            scale: relativeScale,
        });

        await browser.close();
    } catch (err) {
        logger.error("Failed to create pdf", { error: err });
        throw err;
    }

    return pdfPath;
};
