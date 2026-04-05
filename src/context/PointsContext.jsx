// src/context/PointsContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { getPoints } from "../config/database";
import { useAuth } from "./AuthContext";

const PointsContext = createContext();

export const PointsProvider = ({ children }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (user?.$id) {
      getPoints(user.$id).then(setPoints);
    }
  }, [user]);

  return (
    <PointsContext.Provider value={{ points, setPoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => useContext(PointsContext);
