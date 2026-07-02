export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const paramVal = resolvedParams.slug;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Project Details</h1>
      <p className="text-gray-500 mt-2">
        Parameter <code>slug</code>: {paramVal}
      </p>
    </div>
  );
}
