import React from "react";
import { useTranslation } from "react-i18next";
import { I18N_KEYS } from "../i18n/key";

import Button from "./Button";
import RadioGroupField from "./RadioGroupField";

const FRAME_OPTIONS = [1, 12, 30, 60];

const PRESETS = {
    strongest: {
        noiseLevel: 50,
        colorCoverage: 30,
        noiseMode: "color",
        frameCount: 30,
        preset: "strongest",
    },
    stable: {
        noiseLevel: 35,
        colorCoverage: 15,
        noiseMode: "color",
        frameCount: 12,
        preset: "stable",
    },
    none: {
        noiseLevel: 0,
        colorCoverage: 0,
        noiseMode: "grayscale",
        frameCount: 1,
        preset: "none",
    },
};

export const DEFAULT_PROTECTION_SETTINGS = PRESETS.stable;

export default function ProtectionControls({
    addHelperError,
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
                    <div className="mb-1 flex items-center justify-between gap-4">
                        <RadioGroupField
                            label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_doNhieu}
                            moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsMoreInfo_doNhieu}
                            addHelperError={addHelperError}
                        />

                        <span className="rounded-full cursor-default bg-main-bg px-3 py-1 font-ui text-xs text-main-text">
                            {value.noiseLevel}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={value.noiseLevel}
                        onChange={(e) => updateValue({ noiseLevel: Number(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </div>

                <RadioGroupField
                    label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu}
                    moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsMoreInfo_mauNhieu}
                    addHelperError={addHelperError}
                    value={value.noiseMode}
                    onChange={(noiseMode) => updateValue({ noiseMode })}
                    options={[
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu_color, value: "color" },
                        { label: I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_mauNhieu_grayscale, value: "grayscale" },
                    ]}
                />

                <div>
                    <div className="mb-1 flex items-center justify-between gap-4">
                        <RadioGroupField
                            label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_doPhuMau}
                            moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsMoreInfo_doPhuMau}
                            addHelperError={addHelperError}
                        />
                        <span className="rounded-full cursor-default bg-main-bg px-3 py-1 font-ui text-xs text-main-text">
                            {value.colorCoverage}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={value.colorCoverage}
                        onChange={(e) => updateValue({ colorCoverage: Number(e.target.value) })}
                        className="w-full accent-primary"
                    />
                </div>

                

                <div>
                    <div className="mb-1 flex items-center justify-between gap-4">
                        <RadioGroupField
                            label={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsLabel_soLuongFrame}
                            moreInfo={I18N_KEYS.POST_CREATE.COMMON.postCreate_protectionControlsMoreInfo_soLuongFrame}
                            addHelperError={addHelperError}
                        />

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