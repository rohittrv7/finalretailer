import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { LoginForm } from "@/frontend/pages/Login";
import { RegisterForm } from "@/frontend/pages/RegisterForm";

export const AuthTabs = () => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8">
        <TabsTrigger
          value="login"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Login
        </TabsTrigger>
        <TabsTrigger
          value="register"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Register
        </TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-0">
        <LoginForm />
      </TabsContent>
      <TabsContent value="register" className="mt-0">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
};
