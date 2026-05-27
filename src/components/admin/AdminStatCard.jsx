export default function AdminStatCard({ label, value, description }) {
    return (
        <div className="rounded-3xl bg-bg-shade-100 p-5 shadow-sm">
            <p className="text-sm text-main-text/60">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            {description && (
                <p className="mt-2 text-sm text-main-text/60">{description}</p>
            )}
        </div>
    );
}