import { redirect } from "next/navigation";

type LegacyMediaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LegacyMediaPage({ params }: LegacyMediaPageProps) {
  const { slug } = await params;
  redirect(`/capture/${slug}/photos`);
}
