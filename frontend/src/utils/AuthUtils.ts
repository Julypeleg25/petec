import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import globalRouter from "./GlobalRouter";
import { globals } from "./Globals";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const clearStorage = () => {
  localStorage.clear();
};

export const isValidToken = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return false;

  try {
    const decodedToken = JSON.parse(atob(accessToken.split(".")[1]));
    const isTokenValid = decodedToken.exp * 1000 > Date.now();
    return isTokenValid;
  } catch (error) {
    console.error("Error decoding or validating token:", error);
    return false;
  }
};

export const extractDataFromToken = (
  token: string | undefined,
  key: string
) => {
  if (token === undefined) return "";
  let data = JSON.parse(JSON.stringify(jwtDecode(token)))[key];
  return data === undefined ? "" : data;
};

export const setTokens = (
  accessToken: string | undefined,
  refreshToken: string | undefined
) => {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem(
    "userFullName",
    extractDataFromToken(accessToken, "userFullName")
  );
  localStorage.setItem(
    "userRole",
    extractDataFromToken(accessToken, "userRole")
  );
};

export const useCustomNavigate = () => {
  const navigate = useNavigate();

  const redirectToLogin = () => {
    navigate("/login");
  };

  return { redirectToLogin };
};

export const navigateToLogin = (showExpiredMessage = true) => {
  if (showExpiredMessage) {
    const message = "זמן החיבור שלך פג, אנא התחבר שוב";
    toast.error(message, {
      id: message, // Th ID field prevents duplicate toast messages
    });
  }
  if (globalRouter.navigate) globalRouter.navigate("/login");
};

export const handleUserAlreadyLoggedIn = async () => {
  if (isValidToken()) {
    navigateToMain();
  } else {
    try {
      // Try to refresh the token
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const response = await axios.post(globals.auth.refreshToken, {
          refreshToken: refreshToken,
        });
        const newAccessToken = response.data.accessToken;
        const newRefreshToken = response.data.refreshToken;
        setTokens(newAccessToken, newRefreshToken);
        navigateToMain();
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      navigateToLogin();
    }
  }
};

const navigateToMain = () => {
  if (globalRouter.navigate) globalRouter.navigate("/patients/patientsList");
};
