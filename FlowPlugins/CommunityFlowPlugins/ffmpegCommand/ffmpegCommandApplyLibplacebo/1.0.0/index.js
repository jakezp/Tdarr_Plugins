"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Apply Libplacebo',
    description: "\n  Apply libplacebo filter for HDR/Dolby Vision to SDR conversion.\n  \n  This plugin applies the libplacebo filter to convert HDR/Dolby Vision content to SDR.\n  It works between ffmpegCommandStart and ffmpegCommandExecute.\n  ",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video,ffmpeg,hdr,dolby vision,libplacebo',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Colorspace',
            name: 'colorspace',
            type: 'string',
            defaultValue: 'bt709',
            inputUI: {
                type: 'dropdown',
                options: [
                    'bt709',
                    'bt601',
                    'bt2020',
                ],
            },
            tooltip: 'Target colorspace for the output video',
        },
        {
            label: 'Color Primaries',
            name: 'colorPrimaries',
            type: 'string',
            defaultValue: 'bt709',
            inputUI: {
                type: 'dropdown',
                options: [
                    'bt709',
                    'bt601',
                    'bt2020',
                ],
            },
            tooltip: 'Target color primaries for the output video',
        },
        {
            label: 'Color Transfer',
            name: 'colorTransfer',
            type: 'string',
            defaultValue: 'bt709',
            inputUI: {
                type: 'dropdown',
                options: [
                    'bt709',
                    'srgb',
                    'linear',
                ],
            },
            tooltip: 'Target transfer characteristics for the output video',
        },
        {
            label: 'Tonemapping Algorithm',
            name: 'tonemapping',
            type: 'string',
            defaultValue: '4',
            inputUI: {
                type: 'dropdown',
                options: [
                    '0',
                    '1',
                    '2',
                    '3',
                    '4',
                    '5',
                    '6', // linear
                ],
            },
            tooltip: 'Tonemapping algorithm to use (0=clip, 1=mobius, 2=reinhard, 3=hable, 4=bt2390, 5=gamma, 6=linear)',
        },
        {
            label: 'Apply Dolby Vision',
            name: 'applyDolbyVision',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'Apply Dolby Vision processing',
        },
        {
            label: 'Gamut Mode',
            name: 'gamutMode',
            type: 'string',
            defaultValue: '1',
            inputUI: {
                type: 'dropdown',
                options: [
                    '0',
                    '1',
                    '2',
                    '3',
                    '4', // absolute
                ],
            },
            tooltip: 'Color gamut mapping mode (0=clip, 1=perceptual, 2=relative, 3=saturation, 4=absolute)',
        },
        {
            label: 'Contrast Recovery',
            name: 'contrastRecovery',
            type: 'string',
            defaultValue: '0.6',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Contrast recovery value (0.0-1.0)',
        },
        {
            label: 'Tonemapping LUT Size',
            name: 'tonemappingLutSize',
            type: 'string',
            defaultValue: '256',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Size of the tonemapping lookup table',
        },
        {
            label: 'Video Codec',
            name: 'videoCodec',
            type: 'string',
            defaultValue: 'hevc_nvenc',
            inputUI: {
                type: 'dropdown',
                options: [
                    'hevc_nvenc',
                    'h264_nvenc',
                    'libx265',
                    'libx264',
                ],
            },
            tooltip: 'Video codec to use for encoding',
        },
        {
            label: 'Encoding Preset',
            name: 'encodingPreset',
            type: 'string',
            defaultValue: 'p4',
            inputUI: {
                type: 'dropdown',
                options: [
                    'p1',
                    'p2',
                    'p3',
                    'p4',
                    'p5',
                    'p6',
                    'p7',
                    'medium',
                    'slow',
                    'slower',
                ],
            },
            tooltip: 'Encoding preset (p1=slowest/best quality, p7=fastest/worst quality)',
        },
        {
            label: 'CQ/CRF Value',
            name: 'cqValue',
            type: 'string',
            defaultValue: '18',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Constant quality value (lower = better quality)',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    // Extract input parameters
    var colorspace = String(args.inputs.colorspace);
    var colorPrimaries = String(args.inputs.colorPrimaries);
    var colorTransfer = String(args.inputs.colorTransfer);
    var tonemapping = String(args.inputs.tonemapping);
    var applyDolbyVision = args.inputs.applyDolbyVision === 'true';
    var gamutMode = String(args.inputs.gamutMode);
    var contrastRecovery = String(args.inputs.contrastRecovery);
    var tonemappingLutSize = String(args.inputs.tonemappingLutSize);
    var videoCodec = String(args.inputs.videoCodec);
    var encodingPreset = String(args.inputs.encodingPreset);
    var cqValue = String(args.inputs.cqValue);
    // Check if ffmpegCommand is initialized
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    // Cast variables to our extended interface
    var extendedVars = args.variables;
    // Find video stream
    var videoStreams = extendedVars.ffmpegCommand.streams.filter(function (s) { return s.codec_type === 'video' && !s.removed; });
    if (videoStreams.length === 0) {
        args.jobLog('☒ No video streams found');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Process the first video stream
    var videoStream = videoStreams[0];
    // Build libplacebo filter string
    var libplaceboFilter = 'libplacebo=';
    libplaceboFilter += "colorspace=".concat(colorspace, ":");
    libplaceboFilter += "color_primaries=".concat(colorPrimaries, ":");
    libplaceboFilter += "color_trc=".concat(colorTransfer, ":");
    libplaceboFilter += "tonemapping=".concat(tonemapping);
    // Add optional parameters
    libplaceboFilter += ":apply_dolbyvision=".concat(applyDolbyVision ? 'true' : 'false');
    libplaceboFilter += ":gamut_mode=".concat(gamutMode);
    libplaceboFilter += ":contrast_recovery=".concat(contrastRecovery);
    libplaceboFilter += ":tonemapping_lut_size=".concat(tonemappingLutSize);
    // Set up video encoding
    if (!videoStream.outputArgs) {
        videoStream.outputArgs = [];
    }
    // Add filter
    videoStream.outputArgs.push('-vf');
    videoStream.outputArgs.push(libplaceboFilter);
    // Add video codec
    videoStream.outputArgs.push('-c:v');
    videoStream.outputArgs.push(videoCodec);
    // Add encoding preset
    videoStream.outputArgs.push('-preset');
    videoStream.outputArgs.push(encodingPreset);
    // Add quality setting
    if (videoCodec.includes('nvenc')) {
        videoStream.outputArgs.push('-cq');
    }
    else {
        videoStream.outputArgs.push('-crf');
    }
    videoStream.outputArgs.push(cqValue);
    // Mark for processing
    extendedVars.ffmpegCommand.shouldProcess = true;
    args.jobLog("\u2611 Applied libplacebo filter for HDR/Dolby Vision to SDR conversion using ".concat(videoCodec));
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
