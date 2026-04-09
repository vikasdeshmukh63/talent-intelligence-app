import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PopupContext = createContext(null);

export function AppPopupProvider({ children }) {
  const resolverRef = useRef(null);
  const modeRef = useRef("alert");
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "Notice",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
  });

  const closeDialog = useCallback((value) => {
    setDialogState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  }, []);

  const alert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      modeRef.current = "alert";
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        title: options.title || "Notice",
        message: message || "",
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText || "Cancel",
      });
    });
  }, []);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      modeRef.current = "confirm";
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        title: options.title || "Please confirm",
        message: message || "",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
      });
    });
  }, []);

  return (
    <PopupContext.Provider value={{ alert, confirm }}>
      {children}
      <AlertDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) closeDialog(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogState.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {modeRef.current === "confirm" ? (
              <AlertDialogCancel onClick={() => closeDialog(false)}>
                {dialogState.cancelText}
              </AlertDialogCancel>
            ) : null}
            <AlertDialogAction onClick={() => closeDialog(true)}>
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PopupContext.Provider>
  );
}

export function useAppPopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("useAppPopup must be used inside AppPopupProvider.");
  }
  return context;
}
