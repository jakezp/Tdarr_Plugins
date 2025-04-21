"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Standardize Audio',
    description: "\n  Standardize audio streams to AC3 format with specified language.\n  \n  This plugin:\n  1. Keeps only one audio stream in the specified language\n  2. Converts the audio to AC3 format if it's not already\n  3. Downmixes audio channels > 6 to 5.1\n  \n  It works between ffmpegCommandStart and ffmpegCommandExecute.\n  ",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'audio,ffmpeg,ac3',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Audio Language',
            name: 'audioLanguage',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify audio language to keep (e.g., eng, fre, ger)',
        },
        {
            label: 'Bitrate',
            name: 'bitrate',
            type: 'string',
            defaultValue: '448k',
            inputUI: {
                type: 'text',
            },
            tooltip: 'AC3 audio bitrate (e.g., 384k, 448k, 640k)',
        },
        {
            label: 'Keep Only One Audio Stream',
            name: 'keepOnlyOne',
            type: 'boolean',
            defaultValue: 'true',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'If true, only keep one audio stream in the specified language',
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
// Helper function to get the channel count from an audio stream
var getChannelCount = function (stream) {
    if (stream.channels) {
        return stream.channels;
    }
    // Try to determine from channel_layout
    if (stream.channel_layout) {
        if (stream.channel_layout.includes('5.1')) {
            return 6;
        }
        if (stream.channel_layout.includes('7.1')) {
            return 8;
        }
        if (stream.channel_layout.includes('stereo')) {
            return 2;
        }
        if (stream.channel_layout.includes('mono')) {
            return 1;
        }
    }
    // Default to 2 channels if we can't determine
    return 2;
};
// Helper function to get the best audio stream
var getBestAudioStream = function (streams, language) {
    // First try to find a stream with the specified language
    var langStreams = streams.filter(function (s) { var _a; return s.codec_type === 'audio' && ((_a = s.tags) === null || _a === void 0 ? void 0 : _a.language) === language; });
    if (langStreams.length > 0) {
        // Sort by channel count (highest first)
        return langStreams.sort(function (a, b) { return getChannelCount(b) - getChannelCount(a); })[0];
    }
    // If no stream with the specified language, try to find any audio stream
    var audioStreams = streams.filter(function (s) { return s.codec_type === 'audio'; });
    if (audioStreams.length > 0) {
        // Sort by channel count (highest first)
        return audioStreams.sort(function (a, b) { return getChannelCount(b) - getChannelCount(a); })[0];
    }
    return null;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var audioLanguage = String(args.inputs.audioLanguage);
    var bitrate = String(args.inputs.bitrate);
    var keepOnlyOne = args.inputs.keepOnlyOne === 'true';
    // Check if ffmpegCommand is initialized
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var streams = args.variables.ffmpegCommand.streams;
    // Find the best audio stream
    var bestAudioStream = getBestAudioStream(streams, audioLanguage);
    if (!bestAudioStream) {
        args.jobLog('☒ No audio streams found');
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Process audio streams
    streams.forEach(function (stream) {
        if (stream.codec_type === 'audio') {
            // If keepOnlyOne is true, remove all streams except the best one
            if (keepOnlyOne && stream.index !== bestAudioStream.index) {
                stream.removed = true;
                args.jobLog("\u2611 Removing audio stream ".concat(stream.index));
                return;
            }
            // If this is the best stream, check if it needs conversion
            if (stream.index === bestAudioStream.index) {
                var channelCount = getChannelCount(stream);
                var needsDownmix = channelCount > 6;
                var isAc3 = stream.codec_name.toLowerCase() === 'ac3';
                // If already AC3 and doesn't need downmix, just keep it
                if (isAc3 && !needsDownmix) {
                    args.jobLog("\u2611 Keeping AC3 audio stream ".concat(stream.index, " (").concat(channelCount, " channels)"));
                    return;
                }
                // Set up conversion to AC3
                stream.outputArgs = [];
                stream.outputArgs.push('-c:a');
                stream.outputArgs.push('ac3');
                stream.outputArgs.push('-b:a');
                stream.outputArgs.push(bitrate);
                // Add downmix if needed
                if (needsDownmix) {
                    stream.outputArgs.push('-ac');
                    stream.outputArgs.push('6');
                    args.jobLog("\u2611 Converting audio stream ".concat(stream.index, " to AC3 and downmixing from ").concat(channelCount, " to 5.1"));
                }
                else {
                    args.jobLog("\u2611 Converting audio stream ".concat(stream.index, " to AC3 (").concat(channelCount, " channels)"));
                }
            }
        }
    });
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
