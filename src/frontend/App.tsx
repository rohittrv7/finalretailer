import { Loader2 } from "lucide-react";
import SetupWizard from "./components/Layout/SetupWizard";
import Main from "./Main";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { RootState } from "./store/store";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { setAuthData, setAuthError } from "./store/slices/authSlice";

export default function App() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state: RootState) => state.auth);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const savedAuthData = await window.electronAPI.auth.getUser();
        if (savedAuthData && savedAuthData.user) {
          dispatch(setAuthData(savedAuthData));
        } else {
          dispatch(setAuthError(null));
        }
      } catch (error) {
        console.error("Failed to get user:", error);
        dispatch(setAuthError(error.message));
      } finally {
        setChecked(true);
      }
    };
    check();
  }, [dispatch]);

  if (!checked || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {user ? <Main /> : <SetupWizard />}
    </TooltipProvider>
  );
}
