import { createContext, useState, ReactNode } from "react";

interface AnalysisContextType {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
}

const AnalysisContext = createContext<AnalysisContextType>({
  isAnalyzing: false,
  setIsAnalyzing: () => {},
});

interface AnalysisProviderProps {
  children: ReactNode;
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <AnalysisContext.Provider value={{ isAnalyzing, setIsAnalyzing }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export default AnalysisContext;

