import { CgClose } from "react-icons/cg";
import "./Modal.css";

import { ModalProps } from "./Modal.types";

export default function Modal({
  setIsOpen,
  component,
  style,
  closeWhenClickOutside = true,
}: ModalProps) {
  const modalId = "modal-" + new Date().getTime();

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeWhenClickOutside) {
      // Prevent clicks inside the modal from closing it
      if ((event.target as HTMLDivElement).id === modalId) {
        closeModal();
      }
    }
  };

  return (
    <div className="Modal">
      <div className="modal-overlay" onClick={handleOverlayClick} id={modalId}>
        <div className="modal" style={style}>
          <span className="close-button" onClick={closeModal}>
            <CgClose />
          </span>
          {component}
        </div>
      </div>
    </div>
  );
}
