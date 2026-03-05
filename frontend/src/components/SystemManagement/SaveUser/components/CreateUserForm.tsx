import { useForm } from "react-hook-form";
import { FaArrowRight } from "react-icons/fa";
import { getSharedResolver } from "../../../../utils/form";
import { useUserApi } from "../../../../features/system-management/hooks/useUserApi";
import {
  CreateUserFormSchema,
  type CreateUserFormValues,
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
    <div className="SaveUser save-user-dialog" dir="rtl">
      <div className="save-entity-form-container save-user-form-container">
        <div className="save-user-dialog__header">
          <button
            type="button"
            className="btn btn-active btn-round back-btn save-user-dialog__back-btn"
            onClick={onClose}
          >
            <FaArrowRight />
          </button>
          <div className="save-user-dialog__title-wrap">
            <p className="save-user-dialog__subtitle">יצירה</p>
            <h2 className="save-entity-form-title">יצירת משתמש</h2>
          </div>
        </div>
        <form
          className="save-user-dialog__form"
          onSubmit={handleCreate}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="username">שם משתמש</label>
            <input
              id="username"
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
            <label htmlFor="firstName">שם פרטי</label>
            <input
              id="firstName"
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
            <label htmlFor="lastName">שם משפחה</label>
            <input
              id="lastName"
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
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="form-error">{errors.email.message?.toString()}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
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
            <label htmlFor="confirmPassword">אישור סיסמה</label>
            <input
              id="confirmPassword"
              type="password"
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
            <label htmlFor="role">תפקיד</label>
            <select
              id="role"
              {...register("role")}
              aria-invalid={!!errors.role}
            >
              <option value="">בחר תפקיד</option>
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
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? "...יוצר" : "צור משתמש"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
