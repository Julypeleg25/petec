import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadFileMiddleware = upload.single("file");

export default uploadFileMiddleware;
