import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";
import RadioGroupField from "./RadioGroupField";

const FRAME_OPTIONS = [1, 12, 30, 60];

const PRESETS = {
    strongest: {
        noiseLevel: 25,
        colorCoverage: 25,
        noiseColorMode: "dynamic",
        staticColor: "#888888",
        frameCount: 60,
        preset: "strongest",
    },
    stable: {
        noiseLevel: 10,
        colorCoverage: 5,
        noiseColorMode: "dynamic",
        staticColor: "#888888",
        frameCount: 12,
        preset: "stable",
    },
    none: {
        noiseLevel: 0,
        colorCoverage: 0,
        noiseColorMode: "static",
        staticColor: "#888888",
        frameCount: 1,
        preset: "none",
    },
};

export const DEFAULT_PROTECTION_SETTINGS = PRESETS.stable;

export default function ProtectionControls({
    value,
    onChange,
    onRefreshPreview,
    isPreviewLoading = false,
}) {

    const { t } = useTranslation();

    const updateValue = (patch) => {
        onChange({
            ...value,
            ...patch,
            preset: patch.preset ?? "custom",
        });
    };

    const handlePresetChange = (preset) => {
        onChange(PRESETS[preset]);
    };

    const frameIndex = Math.max(0, FRAME_OPTIONS.indexOf(value.frameCount));

    return (
        <div className="rounded-4xl bg-bg-shade-50 p-5 sm:p-6">
            <div className="space-y-7">
                <div>
                    {/* <label className="mb-3 block font-heading text-sm font-medium text-text-shade-300">
                        {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_doNhieu)}
                    </label> */}
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <label className="block font-heading text-sm font-medium text-text-shade-300">
                            {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_doNhieu)}
                        </label>

                        <span className="rounded-full cursor-default bg-main-bg px-3 py-1 font-ui text-xs text-main-text">
                            {value.noiseLevel}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="25"
                        step="1"
                        value={value.noiseLevel}
                        onChange={(e) =>
                            updateValue({ noiseLevel: Number(e.target.value) })
                        }
                        className="w-full accent-primary"
                    />
                </div>

                <div>
                    <label className="mb-3 block font-heading text-sm font-medium text-text-shade-300">
                        {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_doPhuMau)}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="25"
                        value={value.colorCoverage}
                        onChange={(e) => updateValue({ colorCoverage: Number(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </div>

                <RadioGroupField
                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu}
                    value={value.noiseColorMode}
                    onChange={(noiseColorMode) => updateValue({ noiseColorMode })}
                    options={[
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu_static, value: "static" },
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu_dynamic, value: "dynamic" },
                    ]}
                />

                {value.noiseColorMode === "static" && (
                    <div>
                        <label className="mb-3 block font-heading text-sm font-medium text-text-shade-300">
                            {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauTinh)}
                        </label>

                        <div className="overflow-hidden rounded-full bg-main-bg px-1.5 pt-1.5 outline-1 outline-bg-shade-300">
                            <input
                                type="color"
                                value={value.staticColor}
                                onChange={(e) => updateValue({ staticColor: e.target.value })}
                                className="
                                    h-10 w-full cursor-pointer border-0 bg-transparent p-0
                                    [&::-webkit-color-swatch-wrapper]:p-0
                                    [&::-webkit-color-swatch]:border-0
                                    [&::-webkit-color-swatch]:rounded-full
                                    [&::-moz-color-swatch]:border-0
                                    [&::-moz-color-swatch]:rounded-full
                                "
                            />
                        </div>
                    </div>
                )}

                <div>
                    <div className="mb-3 flex items-center justify-between gap-4">
                        <label className="font-heading text-sm font-medium text-text-shade-300">
                            {t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_soLuongFrame)}
                        </label>

                        <span className="rounded-full cursor-default bg-main-bg px-3 py-1 font-ui text-xs text-main-text">
                            {value.frameCount}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={FRAME_OPTIONS.length - 1}
                        step="1"
                        value={frameIndex}
                        onChange={(e) => {
                            const nextFrame = FRAME_OPTIONS[Number(e.target.value)];
                            updateValue({ frameCount: nextFrame });
                        }}
                        className="w-full accent-primary"
                    />

                    <div className="mt-2 flex justify-between font-ui text-xs text-text-shade-300">
                        {FRAME_OPTIONS.map((frame) => (
                            <span key={frame}>{frame}</span>
                        ))}
                    </div>
                </div>

                <RadioGroupField
                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_preset}
                    value={value.preset}
                    onChange={handlePresetChange}
                    options={[
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_preset_strongest, value: "strongest" },
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_preset_stable, value: "stable" },
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_preset_none, value: "none" },
                    ]}
                />

                <Button
                    type="button"
                    size="full"
                    variant="primary"
                    onClick={onRefreshPreview}
                    disabled={isPreviewLoading}
                    className="rounded-full"
                >
                    {isPreviewLoading ? t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsButton_refreshPreviewLoading) : t(I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsButton_refreshPreview)}
                </Button>
            </div>
        </div>
    );
}