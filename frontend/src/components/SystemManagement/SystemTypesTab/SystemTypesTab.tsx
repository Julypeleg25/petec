import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import type { RowData } from "../../../utils/TableGenerator/TableGenerator";

import SaveMedicine from "../SaveMedicine/SaveMedicine";
import SystemTypeForm from "../SystemTypeForm/SystemTypeForm";
import { isSystemTypeFormKey } from "../SystemTypeForm/SystemTypeForm.config";

import { useSystemTypesTab } from "./hooks/useSystemTypesTab";
import { SystemTypesToolbar } from "./components/SystemTypesToolbar";
import { SystemTypeModals } from "./components/SystemTypeModals";
import { createSystemTypesTableButtons } from "./SystemTypesTab.utils";

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
    state.currentSystemTypeConfig.typeName,
  );

  return (
    <div className="system-management-system-types-table" dir="rtl">
      <SystemTypesToolbar
        systemType={state.systemType}
        onSelectSystemType={actions.onSelectSystemType}
      />

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
        extraTableStyling={{ width: "fit-content", minWidth: "100%" }}
      />

      {state.showSaveSystemType && (
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
          actions.uploadBulkTemplate(state.currentSystemTypeConfig.typeName, file)
        }
      />
    </div>
  );
}
