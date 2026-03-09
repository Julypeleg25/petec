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
}: ModalProps) {
  const modalId = "modal-" + new Date().getTime();

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeWhenClickOutside) {
      if ((event.target as HTMLDivElement).id === modalId) {
        closeModal();
      }
    }
  };

  return (
    <div className="Modal">
      <div className="modal-overlay" onClick={handleOverlayClick} id={modalId}>
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
