import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getSharedResolver } from "../../../utils/form";
import { useUserApi } from "../../../features/system-management/hooks/useUserApi";
import {
  CreateUserFormSchema,
  EditUserFormSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
  Role,
  UserRowDTO,
} from "@petec/shared";

import { SaveUserProps } from "./SaveUser.types";
export default function SaveUser({ user, onClose }: SaveUserProps) {
  const isEdit = user !== undefined;

  const { createUser, updateUser } = useUserApi();

  const createForm = useForm<CreateUserFormValues>({
    resolver: getSharedResolver(CreateUserFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: getSharedResolver(EditUserFormSchema),
    defaultValues: { email: user?.email ?? "", role: user?.role },
  });

  useEffect(() => {
    if (user) {
      editForm.reset({ email: user.email, role: user.role });
    }
  }, [user, editForm]);

  const handleCreate = createForm.handleSubmit((values) => {
    createUser.mutate(
      {
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
      },
      { onSuccess: onClose },
    );
  });

  const handleEdit = editForm.handleSubmit((values) => {
    if (!user) return;
    updateUser.mutate(
      { id: user.id, dto: { email: values.email, role: values.role as Role } },
      { onSuccess: onClose },
    );
  });

  const isPending = createUser.isPending || updateUser.isPending;

  if (isEdit) {
    const {
      register,
      formState: { errors },
    } = editForm;

    return (
      <form onSubmit={handleEdit} noValidate>
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
          <label htmlFor="role">תפקיד</label>
          <select id="role" {...register("role")} aria-invalid={!!errors.role}>
            <option value="">בחר תפקיד</option>
            {Object.values(Role).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="form-error">{errors.role.message?.toString()}</p>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={isPending}
          >
            ביטול
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "...שומר" : "שמור שינויים"}
          </button>
        </div>
      </form>
    );
  }

  const {
    register,
    formState: { errors },
  } = createForm;

  return (
    <form onSubmit={handleCreate} noValidate>
      <div className="form-group">
        <label htmlFor="username">שם משתמש</label>
        <input
          id="username"
          type="text"
          {...register("username")}
          aria-invalid={!!errors.username}
        />
        {errors.username && (
          <p className="form-error">{errors.username.message?.toString()}</p>
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
          <p className="form-error">{errors.password.message?.toString()}</p>
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
        <select id="role" {...register("role")} aria-invalid={!!errors.role}>
          <option value="">בחר תפקיד</option>
          {Object.values(Role).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {errors.role && (
          <p className="form-error">{errors.role.message?.toString()}</p>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn"
          onClick={onClose}
          disabled={isPending}
        >
          ביטול
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "...יוצר" : "צור משתמש"}
        </button>
      </div>
    </form>
  );
}
