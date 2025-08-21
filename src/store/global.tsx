import React, { createContext, useContext, useState } from 'react';

interface GlobalContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};

interface GlobalProviderProps {
  children: React.ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [serverUrl, setServerUrl] = useState("http://palkia:3000");

  return (
    <GlobalContext.Provider value={{ serverUrl, setServerUrl }}>
      {children}
    </GlobalContext.Provider>
  );
};