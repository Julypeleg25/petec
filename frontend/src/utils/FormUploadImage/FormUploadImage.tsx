import React, { useCallback, useEffect, useRef, useState, Fragment } from "react";
import { createPortal } from "react-dom";
import "./FormUploadImage.css";
import { FaImage } from "react-icons/fa";
import Webcam from "react-webcam";
import { MdClose, MdOutlineCameraswitch } from "react-icons/md";
import toast from "react-hot-toast";
import { DEFAULT_IMAGE_MIME_TYPE, IMAGE_MIME_TYPES, UPLOAD } from "@petec/shared";

import { FormUploadImageProps } from "./FormUploadImage.types";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";
const CAPTURED_IMAGE_FILE_NAME = "captured-image.jpg";
const WEBCAM_CAPTURE_IDEAL_SIZE = 1280;
const WEBCAM_SCREENSHOT_QUALITY = 0.95;
const MOBILE_CAMERA_MEDIA_QUERY = "(max-width: 700px)";

const ACCEPTED_IMAGE_MIME_TYPES = IMAGE_MIME_TYPES.join(",");
const MAX_IMAGE_SIZE_MB = Math.round(UPLOAD.MAX_FILE_SIZE_BYTES / (1024 * 1024));
const ALLOWED_IMAGE_MIME_TYPE_SET = new Set<string>(IMAGE_MIME_TYPES);

function FormUploadImage({
  uploadedImageId,
  isLarge = false,
  isDefault = false,
  currentImage = "#",
  selectedFile,
  setSelectedFile,
  disabled = false,
  imageClickAction = "file",
}: FormUploadImageProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [facingMode, setFacingMode] = useState(FACING_MODE_ENVIRONMENT);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [localPreviewSrc, setLocalPreviewSrc] = useState<string | null>(null);
  const [isImageActionMenuOpen, setIsImageActionMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY).matches,
  );
  const hasServerImage = currentImage !== "#" && currentImage !== "";
  const useFullscreenCamera = showWebcam && isMobileViewport;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY);
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncViewport);
      return () => mediaQuery.removeEventListener("change", syncViewport);
    }

    mediaQuery.addListener(syncViewport);
    return () => mediaQuery.removeListener(syncViewport);
  }, []);

  useEffect(() => {
    if (!selectedFile && !hasServerImage) {
      setLocalPreviewSrc(null);
    }
  }, [hasServerImage, selectedFile]);

  useEffect(() => {
    if (!useFullscreenCamera || typeof window === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowWebcam(false);
        setIsCameraReady(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [useFullscreenCamera]);

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

  const handleCloseCamera = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowWebcam(false);
    setIsCameraReady(false);
  }, []);

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
      { type: DEFAULT_IMAGE_MIME_TYPE },
    );

    if (!isValidImageFile(capturedFile)) {
      return;
    }

    setLocalPreviewSrc(imageSrc);
    setSelectedFile(capturedFile);
    setShowWebcam(false);
    setIsCameraReady(false);
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
    setIsImageActionMenuOpen(false);
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
    e.stopPropagation();
    setIsImageActionMenuOpen(false);
    setIsCameraReady(false);
    if (typeof window !== "undefined") {
      setIsMobileViewport(window.matchMedia(MOBILE_CAMERA_MEDIA_QUERY).matches);
    }
    setShowWebcam(true);
  }, []);

  const handleImageActionTrigger = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageActionMenuOpen((prev) => !prev);
  }, []);

  const handleChooseFile = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsImageActionMenuOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleUserMediaError = useCallback(() => {
    if (facingMode !== FACING_MODE_USER) {
      setFacingMode(FACING_MODE_USER);
      return;
    }
    setShowWebcam(false);
    setIsCameraReady(false);
    toast.error("לא ניתן לגשת למצלמה במכשיר זה");
  }, [facingMode]);

  const displaySrc = localPreviewSrc || (hasServerImage ? currentImage : null);
  const shouldOpenCameraFromImage = imageClickAction === "camera";
  const shouldShowImageActionChoice = imageClickAction === "choice";

  const webcamControls = (
    <div className="upload-image-webcam">
      <button
        type="button"
        className="btn btn-round upload-image-webcam-close-button"
        onClick={handleCloseCamera}
        aria-label="סגור מצלמה"
      >
        <MdClose size={22} />
      </button>
      <button
        type="button"
        className="btn btn-round upload-image-webcam-swap-camera-button"
        onClick={swapCameras}
        aria-label="החלף מצלמה"
      >
        <MdOutlineCameraswitch size={22} />
      </button>
      <Webcam
        key={facingMode}
        audio={false}
        ref={webcamRef}
        screenshotFormat={DEFAULT_IMAGE_MIME_TYPE}
        forceScreenshotSourceSize
        minScreenshotWidth={WEBCAM_CAPTURE_IDEAL_SIZE}
        minScreenshotHeight={WEBCAM_CAPTURE_IDEAL_SIZE}
        onUserMedia={() => setIsCameraReady(true)}
        onUserMediaError={handleUserMediaError}
        videoConstraints={{
          facingMode: facingMode,
          width: { ideal: WEBCAM_CAPTURE_IDEAL_SIZE },
          height: { ideal: WEBCAM_CAPTURE_IDEAL_SIZE },
        }}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        screenshotQuality={WEBCAM_SCREENSHOT_QUALITY}
      />
    </div>
  );

  const captureButton = !disabled && showWebcam ? (
    <button
      type="button"
      className="btn capture-image-btn"
      onClick={capture}
      disabled={!isCameraReady}
      aria-label="צלם"
    >
      צלם
    </button>
  ) : null;

  const fullscreenCamera =
    useFullscreenCamera && typeof document !== "undefined"
      ? createPortal(
          <div
            className="FormUploadImage FormUploadImage--webcam-active FormUploadImage--webcam-fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="מצלמה"
          >
            <div className="upload-image-container">{webcamControls}</div>
            {captureButton}
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={`FormUploadImage ${showWebcam && !useFullscreenCamera ? "FormUploadImage--webcam-active" : ""} ${useFullscreenCamera ? "FormUploadImage--camera-open" : ""} ${shouldOpenCameraFromImage ? "FormUploadImage--image-opens-camera" : ""} ${shouldShowImageActionChoice ? "FormUploadImage--image-choice" : ""}`}
    >
      <div className={`upload-image-container ${isLarge ? "upload-image-container-large" : ""}`}>
        {showWebcam && !useFullscreenCamera ? (
          webcamControls
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
            {shouldOpenCameraFromImage ? (
              <button
                type="button"
                className="upload-image-camera-hit-area"
                aria-label={displaySrc ? "צלם תמונה שוב" : "צלם תמונה"}
                disabled={disabled}
                onClick={handleOpenCamera}
              />
            ) : shouldShowImageActionChoice ? (
              <Fragment>
                <button
                  type="button"
                  className="upload-image-camera-hit-area upload-image-choice-hit-area"
                  aria-label="אפשרויות תמונה"
                  aria-expanded={isImageActionMenuOpen}
                  disabled={disabled}
                  onClick={handleImageActionTrigger}
                />
                <input
                  ref={fileInputRef}
                  className="upload-image-choice-file-input"
                  type="file"
                  accept={ACCEPTED_IMAGE_MIME_TYPES}
                  disabled={disabled}
                  onChange={handleFileChange}
                />
                {isImageActionMenuOpen && (
                  <div className="upload-image-action-menu" role="menu" aria-label="אפשרויות תמונה">
                    <button type="button" role="menuitem" onClick={handleOpenCamera}>
                      צלם
                    </button>
                    <button type="button" role="menuitem" onClick={handleChooseFile}>
                      העלה
                    </button>
                  </div>
                )}
              </Fragment>
            ) : (
              <input
                ref={fileInputRef}
                className="upload-image-input"
                type="file"
                accept={ACCEPTED_IMAGE_MIME_TYPES}
                disabled={disabled}
                onChange={handleFileChange}
              />
            )}
          </Fragment>
        )}
      </div>

      {!disabled && !useFullscreenCamera && (
        showWebcam ? (
          captureButton
        ) : (
          <button type="button" className="btn capture-image-btn" onClick={handleOpenCamera}>
             {displaySrc ? "צלם תמונה שוב" : "צלם תמונה"}
          </button>
        )
      )}

      {fullscreenCamera}
    </div>
  );
}

export default FormUploadImage;
