import React from "react";

export default function ProtectionImageStrip({
    files,
    selectedIndex,
    onSelect,
}) {
    return (
        <div className="rounded-4xl bg-bg-shade-50 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {files.map((item, index) => {
                    const isSelected = selectedIndex === index;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={`
                                aspect-square overflow-hidden rounded-3xl transition-all
                                ${
                                    isSelected
                                        ? "outline-4 outline-primary scale-[1.02]"
                                        : "outline-1 outline-bg-shade-300 hover:scale-[1.01]"
                                }
                            `}
                        >
                            <img
                                src={item.url}
                                alt={item.file.name}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}