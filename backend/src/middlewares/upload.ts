import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { UPLOAD } from "@petec/shared";
import { ValidationError } from "@utils/errors";

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ValidationError(`File type ${file.mimetype} is not allowed`));
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: UPLOAD.MAX_FILE_SIZE_BYTES,
    },
    fileFilter,
});
