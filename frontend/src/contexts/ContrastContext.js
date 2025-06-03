import React, { createContext, useState, useContext } from 'react';

const ContrastContext = createContext({
  isHighContrast: false,
  toggleContrast: () => {}
});

export function ContrastProvider({ children }) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  const toggleContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  return (
    <ContrastContext.Provider value={{ isHighContrast, toggleContrast }}>
      {children}
    </ContrastContext.Provider>
  );
}

export function useContrast() {
  return useContext(ContrastContext);
}
