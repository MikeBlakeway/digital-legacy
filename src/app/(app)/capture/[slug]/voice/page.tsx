import { redirect } from "next/navigation";

type LegacyVoicePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LegacyVoicePage({ params }: LegacyVoicePageProps) {
  const { slug } = await params;
  redirect(`/capture/${slug}`);
}
