import { useState } from "react";
import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import { FaEdit, FaPlus, FaTrash, FaDownload, FaUpload } from "react-icons/fa";
import FormSelect from "../../../utils/FormSelect/FormSelect";
import { SystemTypes, systemTypesData, type SystemTypeConfig } from "../SystemTypesData";
import { TableFormattingOptionsEnum } from "../../../utils/TableGenerator/TableFormattingOptionsEnum";
import { API_ROUTES } from "../../../config/api-routes";
import { apiClient } from "../../../lib/api-client";
import { downloadFileFromBlob } from "../../../utils/FileUtils";
import Modal from "../../../utils/Modal/Modal";
import UploadFile from "../../../utils/UploadFile/UploadFile";
import SaveMedicine from "../SaveMedicine/SaveMedicine";
import SystemTypeForm from "../SystemTypeForm/SystemTypeForm";
import { SYSTEM_TYPE_CONFIG } from "../SystemTypeForm/SystemTypeForm.config";
import { systemTypesApi } from "../../../features/system-management/system-types.api";
import toast from "react-hot-toast";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator";

import { SystemTypeKey } from "./SystemTypesTab.types";

export default function SystemTypesTab() {
  const [systemType, setSystemType] = useState<SystemTypeKey>("medicines");
  const [reloadTable, setReloadTable] = useState(false);
  const [systemTypeObj, setSystemTypeObj] = useState<RowData | null>(null);
  const [showSaveSystemType, setShowSaveSystemType] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const downloadBulkTemplate = async (sysType: SystemTypes) => {
    try {
      const res = await apiClient.post(
        API_ROUTES.admin.downloadBulkTemplate,
        { systemType: sysType },
        { responseType: "blob" }
      );
      downloadFileFromBlob(res, "text/csv", "template.csv");
      toast.success("הקובץ הורד בהצלחה");
    } catch {
      toast.error("שגיאה בהורדת הקובץ");
    }
  };

  const deleteSystemType = async () => {
    if (!systemTypeObj?.id) return;
    setIsDeleting(true);
    try {
      const config = systemTypesData[systemType];
      if (!config) return;
      await systemTypesApi.delete(config.typeName, String(systemTypeObj.id));
      toast.success("הפריט נמחק בהצלחה");
      setReloadTable(!reloadTable);
      setShowDeleteModal(false);
    } catch {
      toast.error("שגיאה במחיקת הפריט");
    }
    setIsDeleting(false);
  };

  const tableBtns = [
    {
      id: 1,
      btnText: <FaPlus />,
      btnClassName: "btn btn-round table-btn btn-active",
      onClick: (rowData: RowData) => {
        setSystemTypeObj(rowData);
        setShowSaveSystemType(true);
      },
    },
    {
      id: 2,
      btnText: <FaEdit />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: RowData) => {
        setSystemTypeObj(rowData);
        setShowSaveSystemType(true);
      },
      activate: () => true,
    },
    {
      id: 3,
      btnText: <FaTrash />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: RowData) => {
        setSystemTypeObj(rowData);
        setShowDeleteModal(true);
      },
      activate: () => true,
    },
    {
      id: 4,
      title: "הורדת תבנית העלאה",
      btnText: <FaDownload />,
      btnClassName: "btn btn-round table-btn btn-active",
      onClick: (rowData: RowData) => {
        setSystemTypeObj(rowData);
        if (systemTypesData[systemType]?.systemType) {
          downloadBulkTemplate(systemTypesData[systemType]!.systemType as SystemTypes);
        }
      },
    },
    {
      id: 5,
      title: "העלאת תבנית העלאה",
      btnText: <FaUpload />,
      btnClassName: "btn btn-round table-btn btn-active",
      onClick: (rowData: RowData) => {
        setSystemTypeObj(rowData);
        setShowUploadFileModal(true);
      },
    },
  ];

  if (showSaveSystemType) {
    if (systemType === "medicines") {
      return (
        <SaveMedicine
          systemTypeObj={systemTypeObj ?? null}
          setShowSaveSystemType={setShowSaveSystemType}
        />
      );
    } else if (SYSTEM_TYPE_CONFIG[systemType]) {
      return (
        <SystemTypeForm
          systemTypeKey={systemType}
          systemTypeObj={systemTypeObj ?? undefined}
          onClose={() => {
            setShowSaveSystemType(false);
            setReloadTable(!reloadTable);
          }}
        />
      );
    }
    return null;
  }

  return (
    <div className="system-management-system-types-table">
      <FormSelect
        elements={[
          { value: "medicines", text: "תרופות" },
          { value: "animalColors", text: "צבע חיה" },
          { value: "animalTypes", text: "סוג חיה" },
          { value: "fecesTypes", text: "סוג צואה" },
          { value: "urineTypes", text: "סוג שתן" },
          { value: "foodTypes", text: "סוג אוכל" },
          { value: "foodExtrasTypes", text: "סוג תוספות לאוכל" },
          { value: "procedureTypes", text: "סוג פרוצדורה" },
          { value: "genderTypes", text: "מין חיה" },
          { value: "raceTypes", text: "גזע" },
          { value: "measureUnitTypes", text: "מידה" },
          { value: "dosageFrequencyTypes", text: "תדירות" },
          { value: "insuranceTypes", text: "ביטוח" },
          { value: "examinationTypes", text: "סוג בדיקה" },
          { value: "routeOfAdministration", text: "אופן מתן" },
          { value: "animalVitals", text: "סוג התראה" },
        ]}
        optionState={systemType}
        setOptionState={(val) => setSystemType(val as SystemTypeKey)}
        width="fit-content"
        isRequired={true}
        selectId="system-type-select"
        afterSelect={() => setReloadTable(!reloadTable)}
      />
      <TableGenerator
        queryObj={{
          query: systemTypesData[systemType]?.query,
          orderBy: (systemTypesData[systemType] as SystemTypeConfig)?.orderBy ?? {},
          filters: {},
          args: [],
          formatting: {
            created_at: TableFormattingOptionsEnum.TimestampWithTime,
          },
        }}
        columnsData={systemTypesData[systemType]?.columnsData}
        btns={tableBtns}
        reload={reloadTable}
        setOnRowClicked={(row: RowData) => setSystemTypeObj(row)}
        setOnDoubleRowClicked={(row: RowData) => {
          setSystemTypeObj(row);
          setShowSaveSystemType(true);
        }}
        paginationPerPage={20}
      />

      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          component={
            <div className="delete-modal">
              <p>{systemTypesData[systemType]?.deleteMessage}</p>
              <button 
                className="btn btn-large" 
                onClick={deleteSystemType}
                disabled={isDeleting}
              >
                {isDeleting ? "...מוחק" : "מחק"}
              </button>
            </div>
          }
        />
      )}

      {showUploadFileModal && (
        <UploadFile
          setIsOpen={setShowUploadFileModal}
          message="אנא העלה/י את קובץ התבנית המתאים"
          uploadRequestUrl={
            API_ROUTES.admin.uploadBulkTemplate +
            "/" +
            systemTypesData[systemType]?.systemType
          }
          afterUpload={() => setReloadTable(!reloadTable)}
        />
      )}
    </div>
  );
}
