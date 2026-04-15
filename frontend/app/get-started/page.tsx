"use client";

import { useRouter } from "next/navigation";

import AuthModal from "@/components/auth/AuthModal";

export default function GetStartedPage() {
  const router = useRouter();

  return (
    <AuthModal
      initialMode="register"
      isOpen
      onClose={() => router.replace("/")}
    />
  );
}
