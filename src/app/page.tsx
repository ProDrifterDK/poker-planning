"use client";

import RoomManager from "@/components/RoomManager";
import { WelcomeMessage } from "@/components/Onboarding";

export default function HomePage() {
  return (
    <>
      <RoomManager />
      <WelcomeMessage showDelay={2000} />
    </>
  );
}
