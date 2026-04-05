import { createContext, useContext, useState } from "react";

const CareerPathContext = createContext();

export const useCareerPath = () => useContext(CareerPathContext);

export const CareerPathProvider = ({ children }) => {
  const [careerPath, setCareerPath] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);

  const updateCompletion = (newCompletedModules, newProgress) => {
    setCompletedModules(newCompletedModules);
    setCareerPath(prev => ({
      ...prev,
      completedModules: newCompletedModules,
      progress: newProgress
    }));
  };

  return (
    <CareerPathContext.Provider
      value={{
        careerPath,
        setCareerPath,
        completedModules,
        setCompletedModules,
        updateCompletion, // 👈 always use this to sync both
      }}
    >
      {children}
    </CareerPathContext.Provider>
  );
};
