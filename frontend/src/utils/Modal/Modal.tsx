import { CgClose } from "react-icons/cg";
import "./Modal.css";

import { ModalProps } from "./Modal.types";

export default function Modal({
  setIsOpen,
  component,
  style,
  closeWhenClickOutside = true,
  size = "md",
  className,
  overlayClassName,
}: ModalProps) {
  const closeModal = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeWhenClickOutside && event.target === event.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className="Modal">
      <div
        className={`modal-overlay ${overlayClassName || ""}`.trim()}
        onClick={handleOverlayClick}
      >
        <div className={`modal modal-${size} ${className || ""}`.trim()} style={style}>
          <span className="close-button" onClick={closeModal}>
            <CgClose />
          </span>
          {component}
        </div>
      </div>
    </div>
  );
}
