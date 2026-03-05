import React, { useCallback, useRef, useState, Fragment } from "react";
import "./FormUploadImage.css";
import { FaImage } from "react-icons/fa";
import Webcam from "react-webcam";
import { MdOutlineCameraswitch } from "react-icons/md";
import toast from "react-hot-toast";
import { UPLOAD } from "@petec/shared";

import { FormUploadImageProps } from "./FormUploadImage.types";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";
const CAPTURED_IMAGE_FILE_NAME = "captured-image.jpg";

type UploadConfigWithImageMimeTypes = typeof UPLOAD & {
  IMAGE_MIME_TYPES?: readonly string[];
};

const uploadConfig = UPLOAD as UploadConfigWithImageMimeTypes;

const IMAGE_MIME_TYPES = [
  ...(uploadConfig.IMAGE_MIME_TYPES ?? [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ]),
];

const ACCEPTED_IMAGE_MIME_TYPES = IMAGE_MIME_TYPES.join(",");
const MAX_IMAGE_SIZE_MB = Math.round(UPLOAD.MAX_FILE_SIZE_BYTES / (1024 * 1024));
const ALLOWED_IMAGE_MIME_TYPE_SET = new Set<string>(IMAGE_MIME_TYPES);

function FormUploadImage({
  uploadedImageId,
  isLarge = false,
  isDefault = false,
  currentImage = "#",
  setSelectedFile,
  disabled = false,
}: FormUploadImageProps) {
  const webcamRef = useRef<Webcam>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [facingMode, setFacingMode] = useState(FACING_MODE_ENVIRONMENT);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const [localPreviewSrc, setLocalPreviewSrc] = useState<string | null>(null);

  const isValidImageFile = useCallback((file: File): boolean => {
    if (!ALLOWED_IMAGE_MIME_TYPE_SET.has(file.type)) {
      toast.error("סוג קובץ תמונה לא נתמך");
      return false;
    }

    if (file.size > UPLOAD.MAX_FILE_SIZE_BYTES) {
      toast.error(`גודל התמונה חייב להיות עד ${MAX_IMAGE_SIZE_MB}MB`);
      return false;
    }

    return true;
  }, []);

  const dataURLtoBlob = (dataURL: string) => {
    const byteString = atob(dataURL.split(",")[1]);
    const mimeString = dataURL.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  const capture = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("לא ניתן לצלם כעת, נסה/י שוב");
      return;
    }

    const capturedFile = new File(
      [dataURLtoBlob(imageSrc)],
      CAPTURED_IMAGE_FILE_NAME,
      { type: "image/jpeg" },
    );
    
    if (!isValidImageFile(capturedFile)) {
      return;
    }

    setLocalPreviewSrc(imageSrc);
    setSelectedFile(capturedFile);
    setShowWebcam(false);
  }, [isValidImageFile, setSelectedFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalPreviewSrc(event.target?.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [isValidImageFile, setSelectedFile]);

  const swapCameras = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFacingMode((prevState) =>
      prevState === FACING_MODE_USER ? FACING_MODE_ENVIRONMENT : FACING_MODE_USER
    );
    setIsCameraReady(false);
  }, []);

  const handleOpenCamera = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsCameraReady(false);
    setShowWebcam(true);
  }, []);

  const handleUserMediaError = useCallback(() => {
    if (facingMode !== FACING_MODE_USER) {
      setFacingMode(FACING_MODE_USER);
      return;
    }
    setShowWebcam(false);
    toast.error("לא ניתן לגשת למצלמה במכשיר זה");
  }, [facingMode]);

  const hasServerImage = currentImage && currentImage !== "#" && currentImage !== "";
  const displaySrc = localPreviewSrc || (hasServerImage ? currentImage : null);

  return (
    <div className="FormUploadImage">
      <div className={`upload-image-container ${isLarge ? "upload-image-container-large" : ""}`}>
        {showWebcam ? (
          <div className="upload-image-webcam">
            <button
              className="btn btn-round upload-image-webcam-swap-camera-button"
              onClick={swapCameras}
            >
              <MdOutlineCameraswitch size={22} />
            </button>
            <Webcam
              key={facingMode}
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              onUserMedia={() => setIsCameraReady(true)}
              onUserMediaError={handleUserMediaError}
              videoConstraints={{
                facingMode: facingMode,
                aspectRatio: 1
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              screenshotQuality={0.92}
            />
          </div>
        ) : (
          <Fragment>
            {displaySrc ? (
              <img
                id={uploadedImageId}
                className={`upload-image-img ${isDefault && !localPreviewSrc ? "upload-image-img-default" : ""}`}
                src={displaySrc}
                alt="uploaded-img"
              />
            ) : (
              <div id="default-upload-image" className="upload-image-default-placeholder">
                {!isDefault && <FaImage size={80} />}
              </div>
            )}
            <input
              className="upload-image-input"
              type="file"
              accept={ACCEPTED_IMAGE_MIME_TYPES}
              disabled={disabled}
              onChange={handleFileChange}
            />
          </Fragment>
        )}
      </div>

      {!disabled && (
        showWebcam ? (
          <button className="btn capture-image-btn" onClick={capture} disabled={!isCameraReady}>
            צלם
          </button>
        ) : (
          <button className="btn capture-image-btn" onClick={handleOpenCamera}>
             {displaySrc ? "צלם תמונה שוב" : "צלם תמונה"}
          </button>
        )
      )}
    </div>
  );
}

export default FormUploadImage;
