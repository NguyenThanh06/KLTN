export default function PostSearchSkeleton({
    count = 9,
}) {
    return (
        <div className="grid grid-cols-1 gap-6 py-8 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3 xl:gap-12">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-4xl bg-main-bg p-3 shadow-sm"
                >
                    <div
                        className={`
                            rounded-[1.5rem] bg-bg-shade-100
                            ${index % 3 === 0 ? "h-72" : index % 3 === 1 ? "h-96" : "h-80"}
                        `}
                    />

                    <div className="mt-4 h-4 w-4/5 rounded-full bg-bg-shade-100" />
                    <div className="mt-2 h-3 w-2/3 rounded-full bg-bg-shade-100" />

                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-bg-shade-100" />
                        <div className="min-w-0 flex-1">
                            <div className="h-3 w-28 rounded-full bg-bg-shade-100" />
                            <div className="mt-2 h-2.5 w-20 rounded-full bg-bg-shade-100" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}