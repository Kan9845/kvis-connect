import { useState } from "react";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";

export default function AvatarPage() {
  const [value, setValue] = useState<any>(null);

  return <AvatarCustomizer value={value} onChange={setValue} />;
}