import type { Metadata } from "next";
import { Suspense } from "react";
import DSGemsClient from "@/components/DSGemsClient";

export const metadata: Metadata = {
  title: "Contact DS Gems | Buy Certified Gemstones from Sri Lanka",
  description:
    "Contact DS Gems for certified gemstone enquiries. WhatsApp, email or Instagram. Worldwide shipping from Colombo, Sri Lanka.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <DSGemsClient initialGems={[]} initialPage="contact" />
    </Suspense>
  );
}