import "./ForgotPassword.css";
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
    <div className="Login forgot-password-page">
      <div className="login-page-main">
        <img
          className="logo-img"
          src={"/assets/images/petec_logo.jpg"}
          alt="logo_image"
        />
        <form
          className="login-form"
          onSubmit={handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FormInput
            labelText=":אימייל"
            type="email"
            name="email"
            placeholder="אנא הכנס/י את האימייל שלך"
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
            className="btn btn-large login-btn"
            disabled={isLoading}
          >
            {isLoading ? "...שולח" : "שלח/י"}
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

export default ForgotPassword;
