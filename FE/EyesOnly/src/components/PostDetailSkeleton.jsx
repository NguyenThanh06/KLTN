export default function PostDetailSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-8 rounded-4xl bg-main-bg p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:p-8">
                <div className="min-h-130 animate-pulse rounded-4xl bg-bg-shade-100" />

                <div className="flex flex-col gap-4">
                    <div className="h-28 animate-pulse rounded-4xl bg-bg-shade-100" />
                    <div className="h-56 animate-pulse rounded-4xl bg-bg-shade-100" />
                    <div className="h-16 animate-pulse rounded-full bg-bg-shade-100" />
                    <div className="h-72 animate-pulse rounded-4xl bg-bg-shade-100" />
                </div>
            </div>

            <div className="h-80 animate-pulse rounded-4xl bg-bg-shade-100" />
        </div>
    );
}