import { Loader2 } from "lucide-react";
import SetupWizard from "./components/Layout/SetupWizard";
import Main from "./Main";
import { setUser } from "./store/slices/userSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store/store";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { HashRouter } from "react-router-dom";

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.profile);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const savedUser = await window.electronAPI.auth.getUser();
      if (savedUser) {
        dispatch(setUser(savedUser));
      }
      setChecked(true);
    };
    check();
  }, [dispatch]);

  if (!checked) {
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
      {user ? (
        <HashRouter>
          <Main />
        </HashRouter>
      ) : (
        <SetupWizard />
      )}
    </TooltipProvider>
  );
}
