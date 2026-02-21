export interface FormUploadImageProps {
    uploadedImageId: string;
    isLarge?: boolean;
    isDefault?: boolean;
    currentImage?: string;
    setSelectedFile: React.Dispatch<React.SetStateAction<File | Blob | null>>;
    disabled?: boolean;
}
