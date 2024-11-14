"use client";

import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { oAuthLogin } from "./action";

export default function Login() {
  const handleLogin = async () => {
    await oAuthLogin("google");
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <div className="space-y-4 pt-40 justify-center text-center">
        <h1 className="text-4xl font-bold">Log in to PostAll</h1>
        <Button className="w-full xs:w-72 sm:w-96 " onClick={handleLogin}>
          <FcGoogle />
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
