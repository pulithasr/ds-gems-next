import type { Metadata } from "next";
import { Suspense } from "react";
import DSGemsClient from "@/components/DSGemsClient";

export const metadata: Metadata = {
  title: "About DS Gems | Sri Lanka Natural Gemstone Dealer",
  description:
    "DS Gems is a trusted natural gemstone dealer in Sri Lanka and Thailand. Certified Blue Sapphires, Rubies, Emeralds sourced ethically with worldwide shipping.",
};

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <DSGemsClient initialGems={[]} initialPage="about" />
    </Suspense>
  );
}