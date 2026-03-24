import fs from "fs";
import path from "path";
import archiver from "archiver";
import logger from "../../api/utils/Logger";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import cloudinary, { UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

export const zipFile = (
  filePath: string,
  zipFilePath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    output.on("close", () => {
      logger.info(`Zipped ${archive.pointer()} total bytes.`);
      logger.info(`Zip file created at ${zipFilePath}`);
      resolve();
    });

    archive.on("error", (err: any) => {
      reject(err);
    });

    archive.pipe(output);
    archive.file(filePath, { name: path.basename(filePath) });
    archive.finalize();
  });
};

export const createPdf = async (
  templateFile: string,
  data: {},
  outputFileName: string
) => {
  let pdfPath = "";
  try {
    const templateContent = fs.readFileSync(
      (process.env.NODE_ENV === "production" ? "/app" : "src") +
        "/api/PDFTemplates/" +
        templateFile,
      "utf8"
    );
    const template = Handlebars.compile(templateContent);
    const htmlContent = template(data);
    const browser = await puppeteer.launch(
      process.env.NODE_ENV === "production"
        ? {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true,
            executablePath: "/usr/bin/google-chrome",
            timeout: 60000, // Increase timeout to 60 seconds
          }
        : {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: true,
            timeout: 60000, // Increase timeout to 60 seconds
          }
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

      // Fit the PDF to 1 page
      const pageHeight = 846;
      relativeScale =
        contentHeight - pageHeight < 0 ? 1 : pageHeight / contentHeight;
    }

    pdfPath = path.join(__dirname, outputFileName + ".pdf");
    await page.pdf({
      path: pdfPath,
      format: "A4",
      landscape: true,
      printBackground: true,
      scale: relativeScale,
    });
    await browser.close();
  } catch (err) {
    logger.error(`Failed to create pdf ${err}`);
  }

  return pdfPath;
};

const cloudinaryConfig = () => {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadImage = async (
  file: Express.Multer.File
): Promise<string | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const { buffer, originalname } = file;

      // Create a readable stream from the buffer
      const stream = streamifier.createReadStream(buffer);

      cloudinaryConfig();

      // Upload image to Cloudinary
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "auto",
          public_id: originalname,
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error)
            return reject(new Error("Error uploading image to Cloudinary"));
          resolve(result?.secure_url || undefined);
        }
      );

      // Pipe the readable stream to the Cloudinary upload stream
      stream.pipe(uploadStream);
    });
  } catch (error) {
    logger.error(`Error processing image: ${error}`);
  }
};

export const deleteImage = async (imageUrl: string) => {
  try {
    cloudinaryConfig();
    await cloudinary.v2.uploader.destroy(imageUrl);
  } catch (error) {
    logger.error(`Error deleting image: ${error}`);
  }
};
