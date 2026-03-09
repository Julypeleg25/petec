import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import FormInput from "../../utils/FormInput/FormInput";
import { ForgotPasswordDTOSchema, type ForgotPasswordDTO } from "@petec/shared";
import { useForgotPassword } from "../../features/auth/hooks/useForgotPassword";
import { getSharedResolver } from "../../utils/form";
import { AppRoutes } from "../../config/appRoutes";
import { toHebrewErrorMessage } from "../../lib/errorMessages";

const ForgotPassword = () => {
  const { mutate, isPending, error } = useForgotPassword();

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordDTO>({
    resolver: getSharedResolver(ForgotPasswordDTOSchema),
    defaultValues: { email: "" },
  });

  const isLoading = isSubmitting || isPending;

  return (
    <div className="Login">
      <main className="login-page-main">
        <img
          className="logo-img"
          src={"/assets/images/petec_logo_v2.jpg"}
          alt="logo"
        />
        <span className="logo-main-title">PETEC</span>
        <span className="logo-sub-title">שחזור סיסמה</span>
        <form
          className="login-form"
          onSubmit={handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FormInput
            labelText="אימייל"
            type="email"
            placeholder="אימייל"
            isRequired
            state={watch("email")}
            setState={(val: string) =>
              setValue("email", val, { shouldDirty: true, shouldValidate: true })
            }
          />
          {errors.email && (
            <p className="form-error" role="alert">
              {errors.email.message}
            </p>
          )}
          {!errors.email && error && (
            <p className="form-error" role="alert">
              {toHebrewErrorMessage(error)}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-active login-btn"
            disabled={isLoading}
          >
            {isLoading ? "...שולח" : "שלח הוראות לאיפוס"}
          </button>

          <Link
            className="back-to-login-link forgot-password-link"
            to={AppRoutes.Login}
          >
            חזרה לכניסה
          </Link>
        </form>
      </main>
    </div>
  );
};

export default ForgotPassword;
