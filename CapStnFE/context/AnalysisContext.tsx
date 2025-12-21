import { createContext, useState, ReactNode } from "react";

interface AnalysisContextType {
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  isAnalysisComplete: boolean;
  triggerCompletion: () => void;
}

const AnalysisContext = createContext<AnalysisContextType>({
  isAnalyzing: false,
  setIsAnalyzing: () => {},
  isAnalysisComplete: false,
  triggerCompletion: () => {},
});

interface AnalysisProviderProps {
  children: ReactNode;
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);

  const triggerCompletion = () => {
    setIsAnalysisComplete(true);
    // Auto-reset after 800ms for the completion animation
    setTimeout(() => {
      setIsAnalysisComplete(false);
    }, 800);
  };

  return (
    <AnalysisContext.Provider
      value={{ isAnalyzing, setIsAnalyzing, isAnalysisComplete, triggerCompletion }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export default AnalysisContext;

