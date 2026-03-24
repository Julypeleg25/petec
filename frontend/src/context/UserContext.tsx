import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  firstName: string;
  lastName: string;
  userRole?: string;
}

interface UserContextType {
  userState: User;
  updateUser: (firstName: string, lastName: string, userRole: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userState, setUser] = useState<User>(() => {
    const userFullName = localStorage.getItem("userFullName");
    const userRole = localStorage.getItem("userRole");
    return userFullName && userRole
      ? {
          firstName: userFullName.split(" ")[0],
          lastName: userFullName.split(" ")[1],
          userRole: userRole || "",
        }
      : { firstName: "", lastName: "", userRole: "" };
  });

  useEffect(() => {
    localStorage.setItem(
      "userFullName",
      `${userState.firstName} ${userState.lastName}`
    );
    if (userState.userRole)
      localStorage.setItem("userRole", userState.userRole);
  }, [userState]);

  const updateUser = (
    firstName: string,
    lastName: string,
    userRole: string
  ) => {
    setUser({ firstName, lastName, userRole });
  };

  return (
    <UserContext.Provider value={{ userState, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
