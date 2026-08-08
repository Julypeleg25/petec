import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";
import { Button } from "../../utils/Button/Button";
import FormInput from "../../utils/FormInput/FormInput";
import { LoginDTOSchema, type LoginDTO } from "@petec/shared";
import { useLogin } from "../../features/auth/hooks/useLogin";
import { getSharedResolver } from "../../utils/form";
import { AppRoutes } from "../../config/appRoutes";

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
    <Box
      sx={{
        height: "100%",
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: { xs: "flex-start", sm: "center" },
        padding: { xs: "1rem 0.75rem", sm: "1rem" },
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", sm: "90%" },
          minHeight: { xs: 0, sm: 480 },
          maxWidth: 600,
          marginTop: { xs: "1rem", sm: 0 },
          padding: "1.5rem 2rem 2rem",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0px 4px 10px 1px var(--color-soft-box-shadow)",
          borderRadius: "10px",
          background: "var(--color-white)",
        }}
      >
        <Box
          component="img"
          src="/assets/images/house_logo.png"
          alt="logo_image"
          sx={{
            width: "min(280px, 70%)",
            height: "auto",
            display: "block",
            margin: "0.5em auto",
          }}
        />
        <Box
          component="form"
          onSubmit={login}
          noValidate
          sx={{
            marginTop: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "var(--color-main)",
            fontWeight: 500,
            "& .form-input-container": {
              width: { xs: "88%", sm: "75%" },
            },
          }}
        >
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

          <Button
            type="submit"
            disabled={isLoading}
            sx={{
              display: "block",
              margin: "1em auto",
              mt: 3,
              mb: 1.5,
              width: { xs: "min(220px, 80%)", sm: "75%" },
            }}
          >
            התחבר/י
          </Button>
          <Box
            component={Link}
            to={AppRoutes.ForgotPassword}
            sx={{
              marginBottom: "1em",
              color: "var(--color-main)",
              "&:visited, &:hover, &:active": { color: "var(--color-main)" },
            }}
          >
            ?שכחת סיסמא
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
