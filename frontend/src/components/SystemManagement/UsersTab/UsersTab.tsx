import type { UserRowDTO } from "@petec/shared";
import { useState } from "react";
import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import SaveUser from "../SaveUser/SaveUser";
import type { TableBtnConfig } from "../../../utils/TableGenerator/TableGenerator";
import { useUserApi } from "../../../features/system-management/hooks/useUserApi";
import Modal from "../../../utils/Modal/Modal";

export default function UsersTab() {
  const [user, setUser] = useState<UserRowDTO | undefined>();
  const [showSaveUser, setShowSaveUser] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteUser } = useUserApi();
  const [reloadTable, setReloadTable] = useState(false);

  const columnsData = [
    { colName: "שם משתמש", searchObjField: "username", minWidth: "200px" },
    { colName: "שם פרטי", searchObjField: "first_name", minWidth: "200px" },
    { colName: "שם משפחה", searchObjField: "last_name", minWidth: "200px" },
    { colName: "אימייל", searchObjField: "email", minWidth: "200px" },
    { colName: "תפקיד", searchObjField: "role_name", minWidth: "200px" },
  ];

  const tableBtns: TableBtnConfig<UserRowDTO>[] = [
    {
      id: 1,
      btnText: <FaPlus />,
      btnClassName: "btn btn-round table-btn btn-active",
      onClick: () => {
        setUser(undefined);
        setShowSaveUser(true);
      },
    },
    {
      id: 2,
      btnText: <FaEdit />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: UserRowDTO) => {
        setUser(rowData);
        setShowSaveUser(true);
      },
      activate: () => true,
    },
    {
      id: 3,
      btnText: <FaTrash />,
      btnClassName: "btn btn-round table-btn",
      onClick: (rowData: UserRowDTO) => {
        setUser(rowData);
        setShowDeleteModal(true);
      },
      activate: () => true,
    },
  ];

  const handleDelete = () => {
    if (!user?.id) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        setReloadTable(!reloadTable);
        setShowDeleteModal(false);
      },
    });
  };

  if (showSaveUser) {
    return <SaveUser user={user} onClose={() => {
      setShowSaveUser(false);
      setReloadTable(!reloadTable);
    }} />;
  }

  return (
    <div className="system-management-users-table">
      <TableGenerator<UserRowDTO>
        queryObj={{
          query: "users",
          orderBy: {},
          filters: {},
          args: [],
          formatting: {},
        }}
        columnsData={columnsData}
        btns={tableBtns}
        setOnRowClicked={(row: UserRowDTO) => setUser(row)}
        setOnDoubleRowClicked={(row: UserRowDTO) => {
          setUser(row);
          setShowSaveUser(true);
        }}
        reload={reloadTable}
        paginationPerPage={20}
      />

      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          component={
            <div className="delete-modal">
              <p>?האם אתה בטוח שאת/ה רוצה למחוק את המשתמש</p>
              <button 
                className="btn btn-large" 
                onClick={handleDelete}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? "...מוחק" : "מחק"}
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
