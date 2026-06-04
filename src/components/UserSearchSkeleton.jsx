export default function UserSearchSkeleton({
    count = 8,
}) {
    return (
        <div className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="animate-pulse rounded-[1.75rem] bg-main-bg p-3 shadow-sm"
                >
                    <div className="flex items-center gap-3 rounded-[1.35rem] p-1">
                        <div className="h-11 w-11 rounded-full bg-bg-shade-100" />

                        <div className="min-w-0 flex-1">
                            <div className="h-3.5 w-28 rounded-full bg-bg-shade-100" />
                            <div className="mt-2 h-3 w-20 rounded-full bg-bg-shade-100" />
                        </div>
                    </div>

                    <div className="mt-3 h-9 rounded-full bg-bg-shade-100" />
                </div>
            ))}
        </div>
    );
}