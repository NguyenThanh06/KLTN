import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";
import { motion } from "framer-motion";
import {
    Smile,
    X,
} from "lucide-react";

import Button from "./Button";
import { censorProfanityText } from "../utils/profanityCensor";


const COMMENT_EMOJIS = [
    "😊", "😄", "🥰", "😍", "🤗",
    "👏", "✨", "💖", "🌟", "😺",
    "🐱", "🐾", "🍀", "🌈", "🎨",
    "🖌️", "🖼️", "✏️", "💯", "🏆",
];

const COMMENT_TEMPLATES = [
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template1,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template2,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template3,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template4,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template5,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template6,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template7,
    I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalText_template8,
];

export default function CommentComposerModal({
    isOpen,
    title,
    targetName,
    addHelperError,
    onClose,
    onSubmit,
}) {
    const { t, i18n } = useTranslation();

    const textareaRef = useRef(null);

    const [rawValue, setRawValue] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownLeft, setCooldownLeft] = useState(0);
    const [hasConfirmedSensitiveComment, setHasConfirmedSensitiveComment] = useState(false);

    const censorResult = censorProfanityText(rawValue);
    const finalText = censorResult.text || "";
    const isEmpty = finalText.trim().length === 0;
    const isSendDisabled = isSubmitting || cooldownLeft > 0 || isEmpty;

    useEffect(() => {
        if (!cooldownLeft) return undefined;

        const timer = window.setInterval(() => {
            setCooldownLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [cooldownLeft]);

    useEffect(() => {
        if (!isOpen) {
            setRawValue("");
            setShowEmojiPicker(false);
            setIsSubmitting(false);
            setCooldownLeft(0);
            setHasConfirmedSensitiveComment(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const timer = window.setTimeout(() => {
            textareaRef.current?.focus();
        }, 80);

        return () => {
            window.clearTimeout(timer);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const insertTextAtCursor = (text) => {
        text = text + ". "
        const textarea = textareaRef.current;

        if (!textarea) {
            setRawValue((prev) => `${prev}${text}`.slice(0, 255));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const nextValue = `${rawValue.slice(0, start)}${text}${rawValue.slice(end)}`.slice(0, 255);

        setRawValue(nextValue);
        setHasConfirmedSensitiveComment(false);

        window.requestAnimationFrame(() => {
            const nextCursor = Math.min(start + text.length, 255);

            textarea.focus();
            textarea.setSelectionRange(nextCursor, nextCursor);
        });
    };

    const handleChange = (event) => {
        setRawValue(event.target.value);
        setHasConfirmedSensitiveComment(false);
    };

    const handleSubmit = async () => {
        if (isEmpty || isSubmitting || cooldownLeft > 0) return;

        if (censorResult.censored && !hasConfirmedSensitiveComment) {
            addHelperError?.({
                id: Date.now(),
                code: [I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_helper_error_confirmSend, 
                        {targetName: 
                            (
                                targetName || 
                                t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalAltText_recipient)
                            )
                        }],
            });

            setHasConfirmedSensitiveComment(true);
            setCooldownLeft(3);
            return;
        }

        setIsSubmitting(true);

        try {
            await onSubmit?.({
                content: finalText.trim(),
                rawContent: rawValue.trim(),
                censored: censorResult.censored,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-main-text/30 px-3 pb-28 pt-6 backdrop-blur-sm sm:px-4 sm:py-6">
            <div className="flex min-h-full items-start justify-center sm:items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-4xl bg-main-bg p-4 shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
                >
                    <button
                        type="button"
                        className="interaction-pop absolute right-4 top-4 rounded-full bg-bg-shade-50 p-2 text-main-text hover:bg-bg-shade-100"
                        onClick={onClose}
                    >
                        <X size={18} />
                    </button>

                    <div className="mb-4 shrink-0 pr-10 sm:mb-5">
                        <h2 className="font-ui text-xl font-bold text-main-text">
                            {Array.isArray(title) ? t(...title) : t(title || I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalTitle_alt)}
                        </h2>

                        <p className="mt-1 text-sm text-text-shade-400">
                            {t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalDesc)}
                        </p>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
                            <div className="rounded-4xl bg-main-bg">
                                <textarea
                                    ref={textareaRef}
                                    value={rawValue}
                                    maxLength={255}
                                    onChange={handleChange}
                                    placeholder={t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalPlaceholder)}
                                    className="min-h-57.5 w-full resize-none rounded-3xl border border-text-shade-200 bg-main-bg px-4 py-4 text-sm leading-7 text-main-text outline-none focus:border-primary"
                                />

                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="interaction-pop rounded-full bg-main-bg p-3 text-main-text hover:bg-bg-shade-100"
                                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                                        >
                                            <Smile size={18} />
                                        </button>

                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 z-10 mb-2 grid w-64 grid-cols-5 gap-2 rounded-4xl bg-main-bg p-3 shadow-lg">
                                                {COMMENT_EMOJIS.map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        type="button"
                                                        className="interaction-pop rounded-full bg-bg-shade-50 p-2 text-lg hover:bg-bg-shade-100"
                                                        onClick={() => insertTextAtCursor(emoji)}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <p className="font-ui text-xs font-bold text-text-shade-400">
                                        {rawValue.length}/255
                                    </p>
                                </div>

                                {censorResult.censored && (
                                    <div className="mt-3 rounded-3xl bg-text-shade-50 px-4 py-3">
                                        <p className="font-ui text-xs font-bold text-main-text">
                                            {t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalSubtext_censorPreview)}
                                        </p>

                                        <p className="mt-2 wrap-break-word text-sm leading-6 text-text-shade-500">
                                            {finalText}
                                        </p>
                                    </div>
                                )}

                            </div>

                            <div className="rounded-3xl bg-primary-200 p-4">
                                <p className="mb-3 font-ui text-sm font-bold text-main-text">
                                    {t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalSubtext_suggestion)}
                                </p>

                                <div className="grid gap-2">
                                    {COMMENT_TEMPLATES.map((template) => (
                                        <button
                                            key={template}
                                            type="button"
                                            className="interaction-pop rounded-full bg-main-bg px-4 py-3 text-left font-ui text-sm font-bold text-main-text hover:bg-primary-100"
                                            onClick={() => insertTextAtCursor(t(template))}
                                        >
                                            {t(template)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex shrink-0 justify-end border-t border-bg-shade-100 pt-4">
                        <Button
                            type="button"
                            variant="primary"
                            className="interaction-pop rounded-full px-7"
                            disabled={isSendDisabled}
                            onClick={handleSubmit}
                        >
                            {isSubmitting
                                ? t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalButton_sending)
                                : cooldownLeft > 0
                                    ? `${t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalButton_send)} (${cooldownLeft})`
                                    : t(I18N_KEYS.POST_DETAIL.HANDLE.CREATE_COMMENT.postDetail_handleCreateComment_commentComposerModalButton_send)}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}