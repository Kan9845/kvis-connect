import { Suspense } from "react";
import EditPageInner from "./EditPageInner";

export default function EditPage() {
  return (
    <Suspense fallback={null}>
      <EditPageInner />
    </Suspense>
  );
}