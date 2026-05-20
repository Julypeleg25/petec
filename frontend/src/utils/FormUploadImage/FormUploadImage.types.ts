export interface FormUploadImageProps {
    uploadedImageId: string;
    isLarge?: boolean;
    isDefault?: boolean;
    currentImage?: string;
    selectedFile?: File | null;
    setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
    disabled?: boolean;
    imageClickAction?: "file" | "camera" | "choice";
}
