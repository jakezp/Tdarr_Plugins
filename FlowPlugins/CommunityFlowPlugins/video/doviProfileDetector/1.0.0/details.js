"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var details = function () { return ({
    name: 'Dolby Vision Profile Detector',
    description: "This plugin detects if a video file contains Dolby Vision and identifies the profile.\n  It analyzes the file using ffmpeg and looks for DOVI configuration records.\n  \n  The plugin will output to one of the following:\n  - Output 1: DolbyVision - profile 4\n  - Output 2: DolbyVision - profile 5\n  - Output 3: DolbyVision - profile 7\n  - Output 4: DolbyVision - profile 8\n  - Output 5: No DolbyVision/SDR\n  \n  The plugin also sets a flow variable 'dovi_profile' with the detected profile number (4, 5, 7, 8) or 0 for SDR.",
    style: {
        borderColor: 'purple',
    },
    tags: 'video,dolby vision,dovi,hdr,ffmpeg',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'DolbyVision - profile 4',
        },
        {
            number: 2,
            tooltip: 'DolbyVision - profile 5',
        },
        {
            number: 3,
            tooltip: 'DolbyVision - profile 7',
        },
        {
            number: 4,
            tooltip: 'DolbyVision - profile 8',
        },
        {
            number: 5,
            tooltip: 'No DolbyVision/SDR',
        },
    ],
}); };
exports.default = details;
