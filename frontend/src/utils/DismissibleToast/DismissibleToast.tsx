import toast, { ToastBar, Toaster } from "react-hot-toast";
import { HiX } from "react-icons/hi";
import "./DismissibleToast.css";

function DismissibleToast() {
  return (
    <div id="dismissible-toast-container">
      <Toaster
        reverseOrder={false}
        position="top-center"
        toastOptions={{
          success: {
            duration: 5000,
          },
          error: {
            duration: 5000,
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                {t.type !== "loading" && (
                  <button
                    className="react-hot-toast-dismiss-btn"
                    onClick={() => {
                      toast.dismiss(t.id);
                    }}
                  >
                    <HiX />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </div>
  );
}

export default DismissibleToast;
