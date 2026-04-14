"use client";

import { useState } from "react";

import AuthModal, { type AuthModalMode } from "@/components/auth/AuthModal";
import Hero from "@/components/Hero";
import Nav from "@/components/Nav";

export default function LandingAuthShell() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] =
    useState<AuthModalMode>("register");

  function openAuthModal(mode: AuthModalMode) {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }

  return (
    <>
      <Nav onOpenAuthModal={openAuthModal} />
      <Hero onOpenAuthModal={openAuthModal} />
      <AuthModal
        initialMode={authModalMode}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
