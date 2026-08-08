export interface ModalProps {
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    component: JSX.Element;
    style?: React.CSSProperties;
    size?: "sm" | "md" | "lg" | "fullscreen";
    className?: string;
    overlayClassName?: string;
}
