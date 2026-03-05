import "./ResetPassword.css";
import { useForm } from "react-hook-form";
import { useParams, Link } from "react-router-dom";
import FormInput from "../../utils/FormInput/FormInput";
import { useResetPassword } from "../../features/auth/hooks/useResetPassword";
import { getSharedResolver } from "../../utils/form";
import {
  ResetPasswordFormDTOSchema,
  type ResetPasswordFormDTO,
} from "@petec/shared";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const { mutate, isPending } = useResetPassword(token);

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormDTO>({
    resolver: getSharedResolver(ResetPasswordFormDTOSchema),
    defaultValues: { token: token || "", password: "", confirmPassword: "" },
  });

  const isLoading = isSubmitting || isPending;

  return (
    <div className="ResetPassword">
      <div className="reset-password-container">
        <img
          className="logo-img"
          src={"/assets/images/petec_logo_v2.jpg"}
          alt="logo"
        />
        <div className="reset-password-form-container">
          <form
            className="reset-password-form"
            onSubmit={handleSubmit((values) => mutate(values))}
            noValidate
          >
            <FormInput
              labelText="סיסמה חדשה"
              type="password"
              placeholder="סיסמה חדשה"
              isRequired
              state={watch("password")}
              setState={(val: string) =>
                setValue("password", val, { shouldDirty: true, shouldValidate: true })
              }
            />
            {errors.password && (
              <p className="form-error" role="alert">
                {errors.password?.message}
              </p>
            )}

            <FormInput
              labelText="אישור סיסמה"
              type="password"
              placeholder="אישור סיסמה"
              isRequired
              state={watch("confirmPassword")}
              setState={(val: string) =>
                setValue("confirmPassword", val, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.confirmPassword && (
              <p className="form-error" role="alert">
                {errors.confirmPassword?.message}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-active reset-password-btn"
              disabled={isLoading}
            >
              {isLoading ? "...מאפס" : "אפס סיסמה"}
            </button>

            <Link className="back-to-login-link" to="/login">
              חזרה לכניסה
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
