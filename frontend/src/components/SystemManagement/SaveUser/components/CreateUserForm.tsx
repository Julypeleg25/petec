import { useForm } from "react-hook-form";
import Modal from "../../../../utils/Modal/Modal";
import { getSharedResolver } from "../../../../utils/form";
import { useUserApi } from "../../../../features/system-management";
import {
  CreateUserFormSchema,
  type CreateUserFormValues,
  type Role,
  roleLabels,
  roles,
} from "@petec/shared";
import "../SaveUser.css";

interface CreateUserFormProps {
  onClose: () => void;
}

export function CreateUserForm({ onClose }: CreateUserFormProps) {
  const { createUser } = useUserApi();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: getSharedResolver(CreateUserFormSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const handleCreate = handleSubmit((values) => {
    createUser.mutate(
      {
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
      },
      { onSuccess: onClose },
    );
  });

  const isPending = createUser.isPending;

  return (
    <Modal
      setIsOpen={(open: boolean | ((prevState: boolean) => boolean)) => {
        if (!open) onClose();
      }}
      closeWhenClickOutside={true}
      size="lg"
      className="system-management-modal save-user-create-modal"
      overlayClassName="save-user-modal-overlay"
      component={
        <div className="SaveUser save-user-dialog" dir="rtl">
          <div className="save-entity-form-container save-user-form-container">
            <div className="save-user-dialog__header">
              <div className="save-user-dialog__title-wrap">
                <h2 className="save-entity-form-title system-management-modal-title modal-dialog-title">יצירת משתמש</h2>
              </div>
            </div>
            <form
              className="save-user-dialog__form"
              onSubmit={handleCreate}
              noValidate
            >
              <div className="form-group">
                <label htmlFor="username" className="save-user-dialog__required-label">שם משתמש</label>
                <input
                  id="username"
                  type="text"
                  required
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
                <label htmlFor="firstName" className="save-user-dialog__required-label">שם פרטי</label>
                <input
                  id="firstName"
                  type="text"
                  required
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
                <label htmlFor="lastName" className="save-user-dialog__required-label">שם משפחה</label>
                <input
                  id="lastName"
                  type="text"
                  required
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
                <label htmlFor="email" className="save-user-dialog__required-label">אימייל</label>
                <input
                  id="email"
                  type="email"
                  required
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message?.toString()}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="save-user-dialog__required-label">סיסמה</label>
                <input
                  id="password"
                  type="password"
                  required
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="form-error">
                    {errors.password.message?.toString()}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="save-user-dialog__required-label">אישור סיסמה</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="form-error">
                    {errors.confirmPassword.message?.toString()}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role" className="save-user-dialog__required-label">תפקיד</label>
                <select
                  id="role"
                  required
                  {...register("role")}
                  aria-invalid={!!errors.role}
                >
                  <option value="">בחר תפקיד</option>
                  {Object.values(roles).map((role) => {
                    const typedRole = role as Role;
                    return (
                    <option key={typedRole} value={typedRole}>
                      {roleLabels[typedRole]}
                    </option>
                    );
                  })}
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
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? "...יוצר" : "צור משתמש"}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    />
  );
}
