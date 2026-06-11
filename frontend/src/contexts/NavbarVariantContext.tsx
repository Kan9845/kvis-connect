"use client";
import { createContext, useContext, useState } from "react";

type Variant = "dark" | "light";

const Ctx = createContext<{ variant: Variant; setVariant: (v: Variant) => void }>({
  variant: "dark",
  setVariant: () => {},
});

export function NavbarVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<Variant>("light");
  return <Ctx.Provider value={{ variant, setVariant }}>{children}</Ctx.Provider>;
}

export const useNavbarVariant = () => useContext(Ctx);
