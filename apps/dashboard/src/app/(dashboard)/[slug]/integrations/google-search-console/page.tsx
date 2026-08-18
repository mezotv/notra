import { redirect } from "next/navigation";

async function Page({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/geo/prompts`);
}
export default Page;
