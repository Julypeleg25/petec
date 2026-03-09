import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { logger } from "@config/logger";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPdf = async <T extends Record<string, string | number | boolean | undefined | null>>(
    templateFile: string,
    data: T,
    outputFileName: string
): Promise<string> => {
    let pdfPath = "";
    try {
        const templatePath = path.join(__dirname, "..", "templates", templateFile);
        const templateContent = fs.readFileSync(templatePath, "utf8");
        const template = Handlebars.compile(templateContent);
        const htmlContent = template(data);

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            headless: true,
            timeout: 90000,
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, {
            waitUntil: "load",
            timeout: 90000,
        });

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
        const relativeScale = contentHeight - pageHeight < 0 ? 1 : pageHeight / contentHeight;

        pdfPath = path.join(__dirname, "..", "..", "tmp", `${outputFileName}.pdf`);
        const tmpDir = path.dirname(pdfPath);
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

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
