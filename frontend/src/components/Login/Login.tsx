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

  return (
    <div className="Login">
      <main className="login-page-main">
        <img
          className="logo-img"
          src={"assets/images/logo_reversed.jpg"}
          alt="logo"
        />
        <span className="logo-main-title">PETEC</span>
        <span className="logo-sub-title">מערכת ניהול בית חולים לבעלי חיים</span>
        <form
          className="login-form"
          onSubmit={handleSubmit((values) => mutate(values))}
          noValidate
        >
          <FormInput
            labelText="שם משתמש"
            type="text"
            placeholder="שם משתמש"
            isRequired
            state={watch("username")}
            setState={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue("username", e.target.value, { shouldValidate: true })
            }
          />
          {errors.username && (
            <p className="form-error" role="alert">
              {errors.username.message}
            </p>
          )}

          <FormInput
            labelText="סיסמה"
            type="password"
            placeholder="סיסמה"
            isRequired
            state={watch("password")}
            setState={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue("password", e.target.value, { shouldValidate: true })
            }
          />
          {errors.password && (
            <p className="form-error" role="alert">
              {errors.password.message}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-active login-btn"
            disabled={isLoading}
          >
            {isLoading ? "...מתחבר" : "כניסה"}
          </button>

          <Link className="forgot-password-link" to="/forgotPassword">
            שכחתי סיסמה
          </Link>
        </form>
      </main>
    </div>
  );
};

export default Login;
