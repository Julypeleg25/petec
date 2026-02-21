import { useEffect, useRef, useState } from "react";
import "./FormUploadImage.css";
import { FaImage } from "react-icons/fa";
import Webcam from "react-webcam";
import { MdOutlineCameraswitch } from "react-icons/md";

import { FormUploadImageProps } from "./FormUploadImage.types";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

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

  const capture = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (webcamRef.current) {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const video = webcamRef.current.video;

      if (video && context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      const imageSrc = canvas.toDataURL("image/jpeg");
      const img = document.getElementById(uploadedImageId);
      if (img != null) {
        img.onload = () => {
          URL.revokeObjectURL(img.getAttribute("src")!);
        };

        img.setAttribute("src", imageSrc!!);
        setSelectedFile(dataURLtoBlob(imageSrc!!));
        img.style.display = "block";
        document.getElementById("default-upload-image")?.remove();
        img.classList.remove("upload-image-img-default");
        setShowWebcam(false);
      }
    }
  };

  const swapCameras = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFacingMode((prevState) =>
      prevState === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  };

  useEffect(() => {
    if (currentImage !== "#" && currentImage !== "") {
      const img = document.getElementById(uploadedImageId);
      if (img != null) {
        img.style.display = "block";
      }
    }
  }, []);

  return (
    <div className="FormUploadImage">
      <div
        className={
          "upload-image-container" +
          (isLarge ? " upload-image-container-large" : "")
        }
      >
        {showWebcam ? (
          <div className="upload-image-webcam">
            <button
              className="btn btn-round upload-image-webcam-swap-camera-button"
              onClick={swapCameras}
            >
              <MdOutlineCameraswitch size={22} />
            </button>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 1080,
                height: 1080,
                facingMode: facingMode,
              }}
              style={{ width: "100%", height: "100%" }}
              screenshotQuality={1}
            />
          </div>
        ) : (
          <div id="default-upload-image">
            {!isDefault && <FaImage size={80} />}
          </div>
        )}
        <input
          className="upload-image-input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              const img = document.getElementById(uploadedImageId);
              if (img != null) {
                img.onload = () => {
                  URL.revokeObjectURL(img.getAttribute("src")!);
                };

                img.setAttribute("src", URL.createObjectURL(e.target.files[0]));
                setSelectedFile(e.target.files[0]);
                img.style.display = "block";
                img.classList.remove("upload-image-img-default");
              }
            }
          }}
        />
        <img
          id={uploadedImageId}
          className={
            "upload-image-img " + (isDefault ? "upload-image-img-default" : "")
          }
          src={currentImage === "" ? "#" : currentImage}
          alt="uploaded-img"
          style={{ visibility: showWebcam ? "hidden" : "visible" }}
        />
      </div>
      {!disabled &&
        (showWebcam ? (
          <button className="btn capture-image-btn" onClick={capture}>
            צלם
          </button>
        ) : (
          <button
            className="btn capture-image-btn"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setShowWebcam(true);
            }}
          >
            צלם תמונה
          </button>
        ))}
    </div>
  );
}

export default FormUploadImage;
