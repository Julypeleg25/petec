import "./ResetPassword.css";
import { useForm } from "react-hook-form";
import { useParams, Link } from "react-router-dom";
import FormInput from "../../utils/FormInput/FormInput";
import { useResetPassword } from "../../features/auth/hooks/useResetPassword";
import { getSharedResolver } from "../../utils/form";
import { AppRoutes } from "../../config/appRoutes";
import {
  ResetPasswordFormDTOSchema,
  type ResetPasswordFormDTO,
} from "@petec/shared";
import { toHebrewErrorMessage } from "../../lib/errorMessages";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const { mutate, isPending, error } = useResetPassword(token);

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
    <div className="Login reset-password-page">
      <div className="login-page-main">
        <img
          className="logo-img"
          src="/assets/images/house_logo.png"
          alt="logo_image"
        />

        <form
          className="login-form"
          onSubmit={handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FormInput
            labelText=":סיסמא חדשה"
            name="password"
            type="password"
            placeholder="אנא הכנס/י את הסיסמא החדשה שלך"
            isRequired
            state={watch("password")}
            setState={(val: string) =>
              setValue("password", val, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          {errors.password && (
            <p className="form-error" role="alert">
              {errors.password.message}
            </p>
          )}

          <FormInput
            labelText=":אשר סיסמא"
            name="confirmPassword"
            type="password"
            placeholder="אנא אשר/י את הסיסמא החדשה שלך"
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
              {errors.confirmPassword.message}
            </p>
          )}

          {!errors.password && !errors.confirmPassword && error && (
            <p className="form-error" role="alert">
              {toHebrewErrorMessage(error)}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-large login-btn"
            disabled={isLoading}
          >
            {isLoading ? "...שולח" : "שמירה"}
          </button>

          <Link
            className="back-to-login-link"
            to={AppRoutes.Login}
          >
            חזרה להתחברות
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
