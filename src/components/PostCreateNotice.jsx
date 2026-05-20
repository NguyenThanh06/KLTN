import React from "react";

export default function PostCreateNotice({ children }) {
    return (
        <div className="rounded-3xl bg-bg-shade-50 px-5 py-4 text-sm text-text-shade-300 font-body leading-relaxed">
            {children}
        </div>
    );
}