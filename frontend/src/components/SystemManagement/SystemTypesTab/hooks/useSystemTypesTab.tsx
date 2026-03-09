import { useState } from "react";
import { type SystemTypeKey } from "../SystemTypesTab.constants";
import { systemTypesData } from "../../SystemTypesData";
import { systemTypesApi } from "../../../../features/system-management/systemTypes.api";
import { downloadFileFromBlob } from "../../../../utils/FileUtils";
import toast from "react-hot-toast";
import type { RowData } from "../../../../utils/TableGenerator/TableGenerator.types";
import type { SystemTypeName } from "@petec/shared";
import {
  getSystemTypeRowId,
  hasSystemTypeRowId,
} from "../../shared/systemTypeRow.utils";

export const useSystemTypesTab = () => {
  const [systemType, setSystemType] = useState<SystemTypeKey>("medicines");
  const [reloadTable, setReloadTable] = useState(false);
  const [systemTypeObj, setSystemTypeObj] = useState<RowData | null>(null);
  const [showSaveSystemType, setShowSaveSystemType] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentSystemTypeConfig = systemTypesData[systemType];

  const triggerReload = () => setReloadTable((prev) => !prev);

  const onSelectSystemType = (val: SystemTypeKey) => {
    setSystemType(val);
    setSystemTypeObj(null);
    triggerReload();
  };

  const openCreateSystemType = () => {
    setSystemTypeObj(null);
    setShowSaveSystemType(true);
  };

  const openEditSystemType = (rowData: RowData) => {
    if (!hasSystemTypeRowId(rowData)) {
      toast.error("לא ניתן לערוך פריט ללא מזהה");
      return;
    }
    setSystemTypeObj(rowData);
    setShowSaveSystemType(true);
  };

  const openDeleteSystemType = (rowData: RowData) => {
    if (!hasSystemTypeRowId(rowData)) {
      toast.error("לא ניתן למחוק פריט ללא מזהה");
      return;
    }
    setSystemTypeObj(rowData);
    setShowDeleteModal(true);
  };

  const closeFormAndReload = () => {
    setShowSaveSystemType(false);
    triggerReload();
  };

  const downloadBulkTemplate = async (sysType: SystemTypeName) => {
    try {
      const fileBlob = await systemTypesApi.downloadBulkTemplate(sysType);
      downloadFileFromBlob(
        { data: fileBlob, headers: {} },
        "text/csv",
        `${sysType}_template.csv`,
      );
      toast.success("הקובץ הורד בהצלחה");
    } catch {
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  const uploadBulkTemplate = async (
    systemTypeName: SystemTypeName,
    file: File,
  ): Promise<void> => {
    await systemTypesApi.uploadBulkTemplate(systemTypeName, file);
  };

  const deleteSystemType = async () => {
    const rowId = getSystemTypeRowId(systemTypeObj);
    if (!rowId || !currentSystemTypeConfig) return;
    
    setIsDeleting(true);
    try {
      await systemTypesApi.delete(currentSystemTypeConfig.typeName, rowId);
      toast.success("הפריט נמחק בהצלחה");
      triggerReload();
      setShowDeleteModal(false);
    } catch {
      toast.error("שגיאה במחיקת הפריט");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    state: {
      systemType,
      reloadTable,
      systemTypeObj,
      showSaveSystemType,
      showDeleteModal,
      showUploadFileModal,
      isDeleting,
      currentSystemTypeConfig,
    },
    actions: {
      onSelectSystemType,
      openCreateSystemType,
      openEditSystemType,
      openDeleteSystemType,
      closeFormAndReload,
      downloadBulkTemplate,
      uploadBulkTemplate,
      deleteSystemType,
      setSystemTypeObj,
      setShowDeleteModal,
      setShowUploadFileModal,
      triggerReload,
    },
  };
};
