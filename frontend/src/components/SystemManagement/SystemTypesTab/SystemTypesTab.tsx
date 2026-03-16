import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator";
import { FaSlidersH } from "react-icons/fa";

import SaveMedicine from "../SaveMedicine/SaveMedicine";
import SystemTypeForm from "../SystemTypeForm/SystemTypeForm";
import { isSystemTypeFormKey } from "../SystemTypeForm/SystemTypeForm.config";

import { useSystemTypesTab } from "./hooks/useSystemTypesTab";
import { SystemTypesToolbar } from "./components/SystemTypesToolbar";
import { SystemTypeModals } from "./components/SystemTypeModals";
import { createSystemTypesTableButtons } from "./SystemTypesTab.utils";
import AnesthesiaFormTextEditor from "../AnesthesiaFormTextEditor/AnesthesiaFormTextEditor";

import "./SystemTypesTab.css";

export default function SystemTypesTab() {
  const { state, actions } = useSystemTypesTab();

  if (!state.currentSystemTypeConfig) {
    return null;
  }

  const tableBtns = createSystemTypesTableButtons(
    {
      openCreateSystemType: actions.openCreateSystemType,
      openEditSystemType: actions.openEditSystemType,
      openDeleteSystemType: actions.openDeleteSystemType,
      downloadBulkTemplate: actions.downloadBulkTemplate,
      setShowUploadFileModal: actions.setShowUploadFileModal,
    },
    state.currentSystemTypeConfig.typeName
  );

  const isMedicinesTable = state.systemType === "medicines";
  const isAnesthesiaFormTextType = state.systemType === "anesthesiaFormTexts";

  return (
    <div
      className="system-management-system-types-table system-types-tab"
      dir="rtl"
    >
      <div className="system-types-tab__header">
        <div className="system-types-tab__title-wrap">
          <div className="system-types-tab__title-icon">
            <FaSlidersH />
          </div>
          <div>
            <h2 className="system-types-tab__title">ניהול ישויות מערכת</h2>
            <p className="system-types-tab__subtitle">
              ניהול טבלאות מערכת, ערכים קבועים ונתוני עזר
            </p>
          </div>
        </div>

        <div className="system-types-tab__toolbar-wrap">
          <SystemTypesToolbar
            systemType={state.systemType}
            onSelectSystemType={actions.onSelectSystemType}
          />
        </div>
      </div>

      <div
        className={`system-types-tab__table-card ${
          isMedicinesTable ? "system-types-tab__table-card--medicines" : ""
        }`}
      >
        {isAnesthesiaFormTextType ? (
          <AnesthesiaFormTextEditor />
        ) : (
          <TableGenerator
            queryObj={{
              query: state.currentSystemTypeConfig.query,
              orderBy: state.currentSystemTypeConfig.orderBy ?? {},
              filters: {},
              args: [],
            }}
            columnsData={state.currentSystemTypeConfig.columnsData}
            btns={tableBtns}
            reload={state.reloadTable}
            setOnRowClicked={(row: RowData) => actions.setSystemTypeObj(row)}
            setOnDoubleRowClicked={actions.openEditSystemType}
            paginationPerPage={20}
          />
        )}
      </div>

      {state.showSaveSystemType && !isAnesthesiaFormTextType && (
        <>
          {state.systemType === "medicines" ? (
            <SaveMedicine
              systemTypeObj={state.systemTypeObj ?? null}
              onClose={actions.closeFormAndReload}
            />
          ) : isSystemTypeFormKey(state.systemType) ? (
            <SystemTypeForm
              systemTypeKey={state.systemType}
              systemTypeObj={state.systemTypeObj ?? undefined}
              onClose={actions.closeFormAndReload}
            />
          ) : null}
        </>
      )}

      {!isAnesthesiaFormTextType && (
        <SystemTypeModals
          systemType={state.systemType}
          showDeleteModal={state.showDeleteModal}
          setShowDeleteModal={actions.setShowDeleteModal}
          deleteSystemType={actions.deleteSystemType}
          isDeleting={state.isDeleting}
          showUploadFileModal={state.showUploadFileModal}
          setShowUploadFileModal={actions.setShowUploadFileModal}
          triggerReload={actions.triggerReload}
          uploadBulkTemplate={(file) =>
            actions.uploadBulkTemplate(
              state.currentSystemTypeConfig.typeName,
              file
            )
          }
        />
      )}
    </div>
  );
}
