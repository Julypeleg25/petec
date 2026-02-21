export interface UploadFileProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    message?: string;
    uploadRequestUrl: string;
    afterUpload?: () => void;
}
