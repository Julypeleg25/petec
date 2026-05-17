import { FaDownload, FaEdit, FaPlus, FaTrash, FaUpload } from "react-icons/fa";
import type {
  RowData,
  TableBtnConfig,
} from "../../../utils/TableGenerator/TableGenerator.types";
import type { SystemTypeName } from "@petec/shared";

type SystemTypesTableButtonActions = {
  openCreateSystemType: () => void;
  openEditSystemType: (rowData: RowData) => void;
  openDeleteSystemType: (rowData: RowData) => void;
  downloadBulkTemplate: (systemTypeName: SystemTypeName) => void;
  setShowUploadFileModal: (show: boolean) => void;
};

export const createSystemTypesTableButtons = (
  actions: SystemTypesTableButtonActions,
  typeName: SystemTypeName,
): TableBtnConfig<RowData>[] => [
  {
    id: 1,
    btnText: <FaPlus />,
    btnClassName: "btn btn-round table-btn btn-active",
    onClick: actions.openCreateSystemType,
  },
  {
    id: 2,
    btnText: <FaEdit />,
    btnClassName: "btn btn-round table-btn",
    onClick: actions.openEditSystemType,
    activate: () => true,
  },
  {
    id: 3,
    btnText: <FaTrash />,
    btnClassName: "btn btn-round table-btn",
    onClick: actions.openDeleteSystemType,
    activate: () => true,
  },
  {
    id: 4,
    title: "הורדת תבנית העלאה",
    btnText: <FaDownload />,
    btnClassName: "btn btn-round table-btn btn-active",
    onClick: () => {
      actions.downloadBulkTemplate(typeName);
    },
  },
  {
    id: 5,
    title: "העלאת תבנית העלאה",
    btnText: <FaUpload />,
    btnClassName: "btn btn-round table-btn btn-active",
    onClick: () => actions.setShowUploadFileModal(true),
  },
];
