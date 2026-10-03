function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`motion-safe:animate-pulse rounded-sm bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page content"
      className="grid min-h-screen grid-cols-1 md:grid-cols-4"
    >
      <section className="mb-8 min-w-0 p-4 md:col-span-3 md:m-8" aria-hidden="true">
        <SkeletonLine className="mb-5 h-7 w-2/3 max-w-md" />
        <SkeletonLine className="mb-3 h-4 w-full" />
        <SkeletonLine className="mb-2 h-4 w-11/12" />
        <SkeletonLine className="h-4 w-4/5" />
        <div className="my-8 border-t border-gray-300 dark:border-gray-700" />

        <div className="space-y-8">
          {[0, 1, 2].map((item) => (
            <article key={item} className="space-y-3 border-b border-dashed border-gray-300 pb-6 dark:border-gray-700">
              <SkeletonLine className="mx-auto h-4 w-24" />
              <SkeletonLine className="mx-auto h-6 w-4/5 max-w-lg" />
              <SkeletonLine className="mx-auto h-4 w-full max-w-2xl" />
              <SkeletonLine className="mx-auto h-4 w-3/4 max-w-xl" />
              <SkeletonLine className="mx-auto h-3 w-40" />
            </article>
          ))}
        </div>
      </section>

      <aside className="space-y-4 px-4 py-6 md:col-span-1" aria-hidden="true">
        <SkeletonLine className="h-6 w-1/2" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-4 w-5/6" />
        <SkeletonLine className="h-4 w-2/3" />
      </aside>
    </main>
  );
}