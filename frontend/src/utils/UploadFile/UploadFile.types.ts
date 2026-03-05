export interface UploadFileProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    message?: string;
    uploadHandler: (file: File) => Promise<void>;
    afterUpload?: () => void;
}
