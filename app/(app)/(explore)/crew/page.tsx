import ExplorePage from "@/components/modules/pages/explore-page";
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  
  return (
    <div className="w-full">
      <ExplorePage searchParams={resolvedSearchParams} />
    </div>
  );
}
