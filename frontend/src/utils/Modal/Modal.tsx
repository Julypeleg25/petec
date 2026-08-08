import { Box, Dialog } from "@mui/material";
import { CgClose } from "react-icons/cg";

import { ModalProps } from "./Modal.types";

const MODAL_SIZE_SX: Record<NonNullable<ModalProps["size"]>, object> = {
  sm: { width: "min(400px, 90vw)", maxWidth: "90vw" },
  md: { width: "min(560px, 92vw)", maxWidth: "92vw" },
  lg: { width: "min(760px, 95vw)", maxWidth: "95vw" },
  fullscreen: { width: "95vw", maxWidth: "95vw", height: "95vh", maxHeight: "95vh" },
};

export default function Modal({
  setIsOpen,
  component,
  style,
  size = "md",
  className,
  overlayClassName,
}: ModalProps) {
  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      open
      dir="rtl"
      onClose={(_event, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
        closeModal();
      }}
      maxWidth={false}
      sx={{
        "& .MuiDialog-container": {
          "@media screen and (max-width: 650px)": {
            alignItems: "flex-start",
            padding: "0.75rem",
          },
        },
      }}
      slotProps={{
        backdrop: {
          className: overlayClassName,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.22)" },
        },
        paper: {
          className,
          style,
          elevation: 0,
          sx: [
            {
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
              position: "relative",
              maxHeight: "80%",
              minWidth: 0,
              boxSizing: "border-box",
              overflowY: "auto",
              overflowX: "hidden",
              outline: "none",
              "@media screen and (max-width: 650px)": {
                width: "100%",
                maxWidth: "100%",
                maxHeight: "none",
                padding: "1rem",
              },
            },
            MODAL_SIZE_SX[size],
          ],
        },
      }}
    >
      <Box
        component="span"
        onClick={closeModal}
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          fontSize: 20,
          cursor: "pointer",
          "&:hover": { color: "var(--color-main)" },
        }}
      >
        <CgClose />
      </Box>
      {component}
    </Dialog>
  );
}
