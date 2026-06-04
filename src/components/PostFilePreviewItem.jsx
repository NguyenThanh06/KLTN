import React from "react";
import { motion } from "framer-motion";

export default function PostFilePreviewItem({
    item,
    index,
    onRemove,
    onDragStart,
    onDragEnter,
    onDragEnd,
}) {
    return (
        <motion.div
            layout
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            whileHover={{ rotate: -1.5, y: -3 }}
            whileTap={{ scale: 1.03, rotate: 0 }}
            className="group relative aspect-square cursor-grab overflow-hidden rounded-3xl bg-bg-shade-50 outline-1 outline-bg-shade-300 active:cursor-grabbing"
        >
            <img
                src={item.url}
                alt={item.file.name}
                className="h-full w-full object-cover"
                draggable={false}
            />

            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                }}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-main-bg text-main-text shadow-sm transition-all hover:bg-accent-200"
            >
                ×
            </button>

            <div className="absolute inset-x-0 bottom-0 bg-main-bg/80 px-3 py-2">
                <p className="truncate font-ui text-xs text-main-text">
                    {item.file.name}
                </p>
            </div>
        </motion.div>
    );
}