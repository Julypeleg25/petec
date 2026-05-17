import { useCallback, useEffect, useState, type MutableRefObject } from "react";
import { useBeforeUnload } from "react-router-dom";
import { appHistory, type AppHistoryTransition } from "../../../../router/appHistory";
import {
  resolveSavePatientModalOpenState,
  type SavePatientModalOpenState,
} from "../utils/savePatientNavigation.utils";

interface UseSavePatientExitGuardOptions {
  allowNavigationRef: MutableRefObject<boolean>;
  hasChanges: boolean;
  isSaving: boolean;
  onSaveAndExit: () => Promise<boolean>;
}

export function useSavePatientExitGuard({
  allowNavigationRef,
  hasChanges,
  isSaving,
  onSaveAndExit,
}: UseSavePatientExitGuardOptions) {
  const [pendingTransition, setPendingTransition] =
    useState<AppHistoryTransition | null>(null);

  useEffect(() => {
    if (!hasChanges || isSaving) {
      return;
    }

    const unblock = appHistory.block((transition) => {
      if (allowNavigationRef.current) {
        transition.retry();
        return;
      }
      setPendingTransition(transition);
    });

    return unblock;
  }, [allowNavigationRef, hasChanges, isSaving]);

  useEffect(() => {
    if (hasChanges) {
      return;
    }

    allowNavigationRef.current = false;
    setPendingTransition(null);
  }, [allowNavigationRef, hasChanges]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (allowNavigationRef.current || !hasChanges || isSaving) {
          return;
        }
        event.preventDefault();
        event.returnValue = "";
      },
      [allowNavigationRef, hasChanges, isSaving],
    ),
  );

  const closeUnsavedChangesDialog = useCallback(() => {
    setPendingTransition(null);
  }, []);

  const discardAndExit = useCallback(() => {
    if (!pendingTransition) {
      return;
    }

    allowNavigationRef.current = true;
    setPendingTransition(null);
    pendingTransition.retry();
  }, [allowNavigationRef, pendingTransition]);

  const saveAndExit = useCallback(async () => {
    if (!pendingTransition) {
      return;
    }

    const didSave = await onSaveAndExit();
    if (!didSave) {
      return;
    }

    allowNavigationRef.current = true;
    setPendingTransition(null);
    pendingTransition.retry();
  }, [allowNavigationRef, onSaveAndExit, pendingTransition]);

  const handleUnsavedChangesModalOpenChange = useCallback(
    (nextOpen: SavePatientModalOpenState) => {
      if (!resolveSavePatientModalOpenState(nextOpen)) {
        closeUnsavedChangesDialog();
      }
    },
    [closeUnsavedChangesDialog],
  );

  return {
    closeUnsavedChangesDialog,
    discardAndExit,
    handleUnsavedChangesModalOpenChange,
    isUnsavedChangesModalOpen: pendingTransition !== null,
    saveAndExit,
  };
}
