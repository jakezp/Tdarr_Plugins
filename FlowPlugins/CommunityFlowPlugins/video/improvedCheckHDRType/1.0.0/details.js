"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var details = function () { return ({
    name: 'Improved Check HDR Type',
    description: "This plugin provides comprehensive HDR detection for video files.\n  It checks for various HDR formats including:\n  - Dolby Vision\n  - HDR10+\n  - HDR10\n  - HLG\n  \n  The plugin uses multiple detection methods to ensure accurate identification:\n  1. FFprobe color metadata (transfer characteristics, primaries, etc.)\n  2. MediaInfo HDR_Format property\n  3. Side data for Dolby Vision\n  4. Color space information\n  \n  This is an improved version of the checkHDRType plugin with more robust detection.",
    style: {
        borderColor: 'orange',
    },
    tags: 'video,hdr,dolby vision,hdr10,hlg',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'File is Dolby Vision',
        },
        {
            number: 2,
            tooltip: 'File is HDR10+',
        },
        {
            number: 3,
            tooltip: 'File is HDR10',
        },
        {
            number: 4,
            tooltip: 'File is HLG',
        },
        {
            number: 5,
            tooltip: 'File is SDR',
        },
    ],
}); };
exports.default = details;
