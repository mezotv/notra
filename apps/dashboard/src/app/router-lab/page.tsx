import { notFound } from "next/navigation";
import RouterLabClient from "@/app/router-lab/page-client";

export default function RouterLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <RouterLabClient />;
}
