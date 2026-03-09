import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Modal from "../../../../utils/Modal/Modal";
import { getSharedResolver } from "../../../../utils/form";
import { useUserApi } from "../../../../features/system-management/hooks/useUserApi";
import {
  EditUserFormSchema,
  type EditUserFormValues,
  type UserRowDTO,
  Role,
  roles,
} from "@petec/shared";
import "../SaveUser.css";

interface EditUserFormProps {
  user: UserRowDTO;
  onClose: () => void;
}

export function EditUserForm({ user, onClose }: EditUserFormProps) {
  const { updateUser } = useUserApi();

  const editForm = useForm<EditUserFormValues>({
    resolver: getSharedResolver(EditUserFormSchema),
    defaultValues: {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = editForm;

  useEffect(() => {
    editForm.reset({
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
    });
  }, [user, editForm]);

  const handleEdit = handleSubmit((values) => {
    if (!editForm.formState.isDirty) {
      toast.error("לא בוצעו שינויים");
      return;
    }
    updateUser.mutate(
      {
        id: user.id,
        dto: {
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role as Role,
        },
      },
      { onSuccess: onClose },
    );
  });

  const isPending = updateUser.isPending;

  return (
    <Modal
      setIsOpen={(open: boolean | ((prevState: boolean) => boolean)) => {
        if (!open) onClose();
      }}
      size="lg"
      className="system-management-modal"
      component={
        <div className="SaveUser save-user-dialog" dir="rtl">
          <div className="save-entity-form-container save-user-form-container">
            <div className="save-user-dialog__header">
              <div className="save-user-dialog__title-wrap">
                <h2 className="save-entity-form-title system-management-modal-title">
                  עריכת משתמש
                </h2>
              </div>
            </div>
            <form
              className="save-user-dialog__form"
              onSubmit={handleEdit}
              noValidate
            >
              <div className="form-group">
                <label htmlFor="edit-username">שם משתמש</label>
                <input
                  id="edit-username"
                  type="text"
                  {...register("username")}
                  aria-invalid={!!errors.username}
                />
                {errors.username && (
                  <p className="form-error">
                    {errors.username.message?.toString()}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-firstName">שם פרטי</label>
                <input
                  id="edit-firstName"
                  type="text"
                  {...register("firstName")}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="form-error">
                    {errors.firstName.message?.toString()}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-lastName">שם משפחה</label>
                <input
                  id="edit-lastName"
                  type="text"
                  {...register("lastName")}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className="form-error">
                    {errors.lastName.message?.toString()}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">אימייל</label>
                <input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message?.toString()}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="edit-role">תפקיד</label>
                <select
                  id="edit-role"
                  {...register("role")}
                  aria-invalid={!!errors.role}
                >
                  <option>בחר תפקיד</option>
                  {Object.values(roles).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="form-error">{errors.role.message?.toString()}</p>
                )}
              </div>

              <div className="save-user-dialog__actions">
                <button
                  type="button"
                  className="btn btn-active save-user-dialog__cancel-btn"
                  onClick={onClose}
                  disabled={isPending}
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="btn save-user-dialog__submit-btn"
                  disabled={isPending || !editForm.formState.isDirty}
                  aria-busy={isPending}
                >
                  {isPending ? "...שומר" : "שמור שינויים"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    />
  );
}
