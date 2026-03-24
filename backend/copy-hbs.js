const fs = require("fs-extra");

async function copyHbsFiles() {
  try {
    await fs.copy("src/api/PDFTemplates", "dist/api/PDFTemplates");
    console.log("hbs files copied successfully");
  } catch (err) {
    console.error("Error copying hbs files:", err);
  }
}

copyHbsFiles();
