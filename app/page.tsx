import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DSGemsClient from "@/components/DSGemsClient";

export default async function HomePage() {
  let initialGems: any[] = [];

  try {
    const snap = await getDocs(collection(db, "gems"));
    initialGems = snap.docs.map((d) => ({ ...d.data(), firestoreId: d.id }));
  } catch (e) {
    console.error("SSR gem fetch failed:", e);
  }

  return <DSGemsClient initialGems={initialGems} initialPage="home" />;
}