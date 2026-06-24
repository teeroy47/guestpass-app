import { Skeleton } from "@/components/ui/skeleton"

export function AppRouteSkeleton({ standalone = false }: { standalone?: boolean }) {
  if (!standalone) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
        </div>
        <Skeleton className="mt-6 h-[420px] rounded-3xl bg-zinc-200" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_44%,#f4f4f5_100%)] text-black">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl bg-zinc-200" />
          <Skeleton className="h-5 w-32 rounded-full bg-zinc-200" />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Skeleton className="h-4 w-20 rounded-full bg-zinc-200" />
          <Skeleton className="h-4 w-24 rounded-full bg-zinc-200" />
          <Skeleton className="h-4 w-20 rounded-full bg-zinc-200" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full bg-zinc-200" />
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Skeleton className="mx-auto h-16 w-11/12 rounded-2xl bg-zinc-200 sm:h-20" />
          <Skeleton className="mx-auto mt-4 h-16 w-8/12 rounded-2xl bg-zinc-200" />
          <Skeleton className="mx-auto mt-6 h-6 w-7/12 rounded-full bg-zinc-200" />
          <Skeleton className="mx-auto mt-3 h-6 w-5/12 rounded-full bg-zinc-200" />
          <div className="mt-8 flex justify-center gap-3">
            <Skeleton className="h-12 w-36 rounded-full bg-zinc-200" />
            <Skeleton className="h-12 w-32 rounded-full bg-zinc-200" />
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
          <Skeleton className="h-28 rounded-2xl bg-zinc-200" />
        </div>
        <Skeleton className="mt-8 h-[520px] rounded-[2rem] bg-zinc-200" />
      </main>
    </div>
  )
}
