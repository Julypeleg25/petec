import type { UserRowDTO } from "@petec/shared";
import { useMemo, useState } from "react";
import TableGenerator from "../../../utils/TableGenerator/TableGenerator";
import { FaEdit, FaPlus, FaTrash, FaUsers } from "react-icons/fa";
import SaveUser from "../SaveUser/SaveUser";
import type { TableBtnConfig } from "../../../utils/TableGenerator/TableGenerator";
import { useUserApi } from "../../../features/system-management";
import { Button } from "../../../utils/Button/Button";
import Modal from "../../../utils/Modal/Modal";
import "./UsersTab.css";

export default function UsersTab() {
  const [user, setUser] = useState<UserRowDTO | undefined>();
  const [showSaveUser, setShowSaveUser] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reloadTable, setReloadTable] = useState(false);
  const { deleteUser } = useUserApi();

  const columnsData = useMemo(
    () => [
      { colName: "שם משתמש", searchObjField: "username", minWidth: "200px" },
      { colName: "שם פרטי", searchObjField: "first_name", minWidth: "180px" },
      { colName: "שם משפחה", searchObjField: "last_name", minWidth: "180px" },
      { colName: "אימייל", searchObjField: "email", minWidth: "240px" },
      { colName: "תפקיד", searchObjField: "role_name", minWidth: "160px" },
    ],
    []
  );

  const tableBtns: TableBtnConfig<UserRowDTO>[] = [
    {
      id: 2,
      btnText: <FaEdit />,
      btnClassName: "btn btn-round table-btn users-table__icon-btn",
      onClick: (rowData: UserRowDTO) => {
        setUser(rowData);
        setShowSaveUser(true);
      },
      activate: () => true,
    },
    {
      id: 3,
      btnText: <FaTrash />,
      btnClassName:
        "btn btn-round table-btn users-table__icon-btn users-table__icon-btn--danger",
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
        setReloadTable((prev) => !prev);
        setShowDeleteModal(false);
      },
    });
  };

  if (showSaveUser) {
    return (
      <SaveUser
        user={user}
        onClose={() => {
          setShowSaveUser(false);
          setReloadTable((prev) => !prev);
        }}
      />
    );
  }

  return (
    <div className="users-tab" dir="rtl">
      <div className="users-tab__header">
        <div className="users-tab__title-wrap">
          <div className="users-tab__title-icon">
            <FaUsers />
          </div>
          <div>
            <h2 className="users-tab__title">ניהול משתמשים</h2>
            <p className="users-tab__subtitle">
              יצירה, עריכה ומחיקה של משתמשי מערכת
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="users-tab__create-btn"
          onClick={() => {
            setUser(undefined);
            setShowSaveUser(true);
          }}
        >
          <FaPlus />
          <span>יצירת משתמש</span>
        </Button>
      </div>

      <div className="users-tab__table-card">
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
      </div>

      {showDeleteModal && (
        <Modal
          setIsOpen={setShowDeleteModal}
          className="system-management-modal"
          component={
            <div className="users-delete-modal" dir="rtl">
              <h3 className="users-delete-modal__title system-management-modal-title modal-dialog-title">
                מחיקת משתמש
              </h3>
              <p className="users-delete-modal__text">
                האם למחוק את המשתמש <strong>{user?.username ?? ""}</strong>?
              </p>

              <div className="users-delete-modal__actions">
                <Button
                  type="button"
                  active
                  className="users-delete-modal__cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteUser.isPending}
                >
                  ביטול
                </Button>

                <Button
                  type="button"
                  className="users-delete-modal__confirm-btn"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                >
                  {deleteUser.isPending ? "...מוחק" : "מחק"}
                </Button>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
}
