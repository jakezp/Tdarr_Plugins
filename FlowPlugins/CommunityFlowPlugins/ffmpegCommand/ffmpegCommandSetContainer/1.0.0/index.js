"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Set Container',
    description: "\n  Set the output container format for the file.\n  \n  This plugin sets the container format (MP4/MKV) for the output file.\n  It works between ffmpegCommandStart and ffmpegCommandExecute.\n  ",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'container,ffmpeg,mp4,mkv',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Container Format',
            name: 'containerFormat',
            type: 'string',
            defaultValue: 'mp4',
            inputUI: {
                type: 'dropdown',
                options: [
                    'mp4',
                    'mkv',
                ],
            },
            tooltip: 'Container format for the output file',
        },
        {
            label: 'Force Remux',
            name: 'forceRemux',
            type: 'boolean',
            defaultValue: 'false',
            inputUI: {
                type: 'dropdown',
                options: [
                    'true',
                    'false',
                ],
            },
            tooltip: 'Force remux even if the file is already in the target container format',
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
    var containerFormat = String(args.inputs.containerFormat).toLowerCase();
    var forceRemux = args.inputs.forceRemux === 'true';
    // Check if ffmpegCommand is initialized
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    // Get current container format
    var currentContainer = args.inputFileObj.container.toLowerCase();
    // Check if remux is needed
    var needsRemux = forceRemux || currentContainer !== containerFormat;
    if (!needsRemux) {
        args.jobLog("\u2611 File is already in ".concat(containerFormat, " format, no remux needed"));
        return {
            outputFileObj: args.inputFileObj,
            outputNumber: 1,
            variables: args.variables,
        };
    }
    // Cast variables to our extended interface
    var extendedVars = args.variables;
    // Set the container format
    extendedVars.ffmpegCommand.container = containerFormat;
    extendedVars.ffmpegCommand.shouldProcess = true;
    // Add specific settings for MP4 container
    if (containerFormat === 'mp4') {
        // Initialize outputArgs if needed
        extendedVars.ffmpegCommand.outputArgs = extendedVars.ffmpegCommand.outputArgs || [];
        // Add MP4 specific flags
        extendedVars.ffmpegCommand.outputArgs.push('-movflags', '+faststart');
        // Add strict unofficial for Dolby Vision support
        extendedVars.ffmpegCommand.outputArgs.push('-strict', 'unofficial');
        // Drop data streams as they can cause issues in MP4
        extendedVars.ffmpegCommand.outputArgs.push('-dn');
        // Check for HEVC video streams that need annexb bitstream filter
        var videoStreams = extendedVars.ffmpegCommand.streams.filter(function (s) { return s.codec_type === 'video' && !s.removed; });
        videoStreams.forEach(function (stream) {
            if (stream.codec_name.toLowerCase() === 'hevc') {
                if (!stream.outputArgs) {
                    stream.outputArgs = [];
                }
                // Add hevc_mp4toannexb bitstream filter for HEVC streams
                stream.outputArgs.push('-bsf:v', 'hevc_mp4toannexb');
            }
        });
        args.jobLog('☑ Setting container format to MP4 with faststart and Dolby Vision support');
    }
    else {
        args.jobLog("\u2611 Setting container format to ".concat(containerFormat.toUpperCase()));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
