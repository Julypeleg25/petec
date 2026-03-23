import { logger } from "../../config/logger.js";
import { systemTypesRepository } from "../../repositories/admin/index.js";
import { ValidationError } from "../../constants/error.constants.js";
import type { SystemTypeName } from "@petec/shared";
import type { BaseLookup } from "../../types/global.types.js";
import {
  BULK_TEMPLATE_CSV,
  parseBulkTemplateCsvLine,
  toBulkTemplateCsvRow,
} from "./utils/index.js";

const MODULE = "bulkTemplate";

export class BulkTemplateService {
  async downloadTemplate(typeName: SystemTypeName): Promise<Buffer> {
    const docs = await systemTypesRepository.findAll(typeName);
    const lines = [
      BULK_TEMPLATE_CSV.HEADER,
      ...docs.map((doc) => toBulkTemplateCsvRow(doc.toObject())),
    ];
    const csv = lines.join(BULK_TEMPLATE_CSV.LINE_BREAK);

    logger.info("Bulk template downloaded", {
      module: MODULE,
      type_name: typeName,
      row_count: docs.length,
    });

    return Buffer.from(csv, BULK_TEMPLATE_CSV.ENCODING);
  }

  async uploadTemplate(
    typeName: SystemTypeName,
    fileBuffer: Buffer,
  ): Promise<number> {
    const content = fileBuffer.toString(BULK_TEMPLATE_CSV.ENCODING);
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length < BULK_TEMPLATE_CSV.MIN_LINES_WITH_HEADER) {
      throw new ValidationError(
        "CSV file must have at least a header and one data row",
      );
    }

    const dataLines = lines.slice(1);
    const parsed = dataLines
      .map(parseBulkTemplateCsvLine)
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (parsed.length === 0) {
      throw new ValidationError("No valid rows found in CSV");
    }

    let created = 0;
    for (const row of parsed) {
      const existing = await systemTypesRepository.findByNameIncludingDeleted(
        typeName,
        row.name,
      );
      if (existing) {
        throw new ValidationError(
          `Cannot create "${row.name}": a record with this name already exists`,
        );
      }

      await systemTypesRepository.create(typeName, {
        name: row.name,
        isDeleted: row.isDeleted,
      } as Partial<BaseLookup>);
      created++;
    }

    logger.info("Bulk template uploaded", {
      module: MODULE,
      type_name: typeName,
      total_rows: parsed.length,
      created,
    });

    return created;
  }
}

export const bulkTemplateService = new BulkTemplateService();
