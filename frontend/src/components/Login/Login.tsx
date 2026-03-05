import "./Login.css";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import FormInput from "../../utils/FormInput/FormInput";
import { LoginDTOSchema, type LoginDTO } from "@petec/shared";
import { useLogin } from "../../features/auth/hooks/useLogin";
import { getSharedResolver } from "../../utils/form";

const Login = () => {
  const { mutate, isPending } = useLogin();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginDTO>({
    resolver: getSharedResolver(LoginDTOSchema),
    defaultValues: { username: "", password: "" },
  });

  const isLoading = isSubmitting || isPending;
  const login = handleSubmit((values) => mutate(values));

  const handleInputChange = (
    value: string,
    params?: object | string | number,
    fieldName?: string,
  ) => {
    const candidateField =
      typeof fieldName === "string"
        ? fieldName
        : typeof params === "string"
          ? params
          : undefined;

    if (candidateField === "username" || candidateField === "password") {
      setValue(candidateField, value, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="Login">
      <div className="login-page-main">
        <img
          className="logo-img"
          src={"/assets/images/petec_logo_v2.jpg"}
          alt="logo_image"
        />
        <form className="login-form" onSubmit={login} noValidate>
          <FormInput
            labelText=":שם משתמש"
            name="username"
            type="text"
            placeholder="אנא הכנס/י את שם המשתמש שלך"
            isRequired
            state={watch("username")}
            setState={handleInputChange}
            minLength={6}
          />
          {errors.username && (
            <p className="form-error" role="alert">
              {errors.username.message}
            </p>
          )}

          <FormInput
            labelText=":סיסמא"
            name="password"
            type="password"
            placeholder="אנא הכנס/י את הסיסמא שלך"
            isRequired
            state={watch("password")}
            setState={handleInputChange}
            minLength={6}
          />
          {errors.password && (
            <p className="form-error" role="alert">
              {errors.password.message}
            </p>
          )}

          <button type="submit" className="btn btn-large login-btn" disabled={isLoading}>
            התחבר/י
          </button>
          <Link to="/forgotPassword" className="forgot-password-link">
            ?שכחת סיסמא
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
