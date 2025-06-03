import React, { createContext, useState, useContext } from 'react';

const FontSizeContext = createContext({
  fontSize: 100,           // w procentach, 100% = domyślny rozmiar
  increase: () => {},
  decrease: () => {},
  reset: () => {}
});

export function FontSizeProvider({ children }) {
  const [fontSize, setFontSize] = useState(100);

  const increase = () => {
    setFontSize((prev) => {
      const next = prev + 10;
      return next > 200 ? 200 : next; // max 200%
    });
  };

  const decrease = () => {
    setFontSize((prev) => {
      const next = prev - 10;
      return next < 50 ? 50 : next; // min 50%
    });
  };

  const reset = () => {
    setFontSize(100);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, increase, decrease, reset }}>
      {children}
    </FontSizeContext.Provider>
  );
}

// Hook do wygodnego pobierania funkcji/contextu
export function useFontSize() {
  return useContext(FontSizeContext);
}
