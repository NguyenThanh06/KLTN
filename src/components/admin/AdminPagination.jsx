export default function AdminPagination({ page, totalPages, onChange }) {
    if (!totalPages || totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

    return (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
                className="rounded-full bg-main-bg px-4 py-2 text-sm text-main-text disabled:opacity-40 hover:bg-bg-shade-100"
            >
                Trước
            </button>

            {pages.map((item) => (
                <button
                    key={item}
                    type="button"
                    onClick={() => onChange(item)}
                    className={`h-9 min-w-9 rounded-full px-3 text-sm text-main-text transition ${
                        item === page
                            ? "bg-primary hover:bg-primary-700"
                            : "bg-main-bg hover:bg-bg-shade-100"
                    }`}
                >
                    {item}
                </button>
            ))}

            <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
                className="rounded-full bg-main-bg px-4 py-2 text-sm text-main-text disabled:opacity-40 hover:bg-bg-shade-100"
            >
                Sau
            </button>
        </div>
    );
}