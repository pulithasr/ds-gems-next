import type { Metadata } from "next";
import DSGemsClient from "@/components/DSGemsClient";

export const metadata: Metadata = {
  title: "Contact DS Gems | Buy Certified Gemstones from Sri Lanka",
  description:
    "Contact DS Gems for certified gemstone enquiries. WhatsApp, email or Instagram. Worldwide shipping from Colombo, Sri Lanka.",
};

export default function ContactPage() {
  return <DSGemsClient initialGems={[]} initialPage="contact" />;
}