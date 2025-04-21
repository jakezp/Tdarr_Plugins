"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var details = function () { return ({
    name: 'Simple Media Stream Handler',
    description: "This plugin provides comprehensive media stream handling:\n  - If an English AC3 5.1 stream exists, it's kept and all others are removed.\n  - If not, the best available English audio stream (highest channel count) is converted to AC3 \n    (downmixing channels > 6 to 5.1 if necessary), and all others are removed.\n  - If no English audio stream exists, audio streams remain untouched.\n  - All non-English subtitle streams are removed.\n  - Streams are re-ordered: Video, Audio, Subtitle.\n  - The container is set to MKV.",
    style: {
        borderColor: 'blue',
    },
    tags: 'audio,ac3,subtitle,mkv,ffmpeg,media,stream',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Keep Only English AC3',
            name: 'keepOnlyEnglishAC3',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'If true, only keep one English AC3 audio stream and remove all others.',
        },
        {
            label: 'Remove Non-English Subtitles',
            name: 'removeNonEnglishSubs',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'If true, remove all non-English subtitle streams.',
        },
        {
            label: 'Convert to MKV',
            name: 'convertToMkv',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'If true, convert the container to MKV.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.default = details;
