export default async function Page({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const resolvedParams = await params;
  const paramVal = resolvedParams.tool;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Developer Tool</h1>
      <p className="text-gray-500 mt-2">
        Parameter <code>tool</code>: {paramVal}
      </p>
    </div>
  );
}
