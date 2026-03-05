import Modal from "../Modal/Modal";
import "./UploadFile.css";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { UploadFileProps } from "./UploadFile.types";

function UploadFile({
  setIsOpen,
  message,
  uploadHandler,
  afterUpload,
}: UploadFileProps) {
  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const handleClick = () => {
    hiddenFileInput.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const FILE_MAX_SIZE_IN_BYTES = 10_000_000;
    if (file.size < FILE_MAX_SIZE_IN_BYTES) {
      setFileName(file.name);
      setSelectedFile(file);
    } else {
      toast.error("10MB -הקובץ חייב להיות קטן מ");
    }
  };

  const upload = async () => {
    if (!selectedFile) {
      toast.error("לא נבחר קובץ להעלאה");
      return;
    }

    disableUploadBtn(true);
    try {
      await uploadHandler(selectedFile);
      toast.success("הקובץ הועלה בהצלחה");
    } catch {
      toast.error("שגיאה בהעלאת הקובץ");
    }
  };

  const disableUploadBtn = (disabled: boolean) => {
    const btn = document.getElementById("upload-file-btn");
    if (btn) {
      if (disabled) btn.setAttribute("disabled", disabled.valueOf().toString());
      else btn.removeAttribute("disabled");
    }
  };

  return (
    <Modal
      setIsOpen={setIsOpen}
      component={
        <div className="UploadFile">
          {message !== undefined && (
            <div className="upload-file-massage">{message}</div>
          )}
          <button
            className="btn table-btn btn-active upload-file-btn"
            onClick={handleClick}
          >
            העלה קובץ
            <input
              className="upload-file-input"
              id="file-upload"
              type="file"
              name="file"
              ref={hiddenFileInput}
              onChange={(e) => {
                handleChange(e);
                disableUploadBtn(false);
              }}
            />
          </button>
          {fileName !== "" && fileName}
          {selectedFile && (
            <div>
              <button
                id="upload-file-btn"
                className="btn table-btn btn-active upload-file-btn"
                disabled={!selectedFile}
                onClick={() => {
                  upload()
                    .then(() => {
                      if (afterUpload) afterUpload();
                      setIsOpen(false);
                    })
                    .catch(() => {
                      // handled by toast
                    });
                }}
              >
                אישור
              </button>
            </div>
          )}
        </div>
      }
    />
  );
}

export default UploadFile;
