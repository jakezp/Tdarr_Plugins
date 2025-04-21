"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var flowUtils_1 = require("../../../../FlowHelpers/1.0.0/interfaces/flowUtils");
/* eslint-disable no-param-reassign */
var details = function () { return ({
    name: 'Extract Subtitles',
    description: "\n  Extract subtitles to SRT files alongside the video file.\n  \n  This plugin only extracts subtitles without affecting other streams.\n  It works between ffmpegCommandStart and ffmpegCommandExecute.\n  ",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'subtitle,ffmpeg',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Subtitle Languages',
            name: 'subtitleLanguages',
            type: 'string',
            defaultValue: 'eng',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify subtitle languages to extract using comma separated list e.g. eng,hun',
        },
        {
            label: 'Extract Path',
            name: 'extractPath',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to extract subtitles to. Leave empty to use the same directory as the input file.',
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
var getOutputStreamIndex = function (streams, stream) {
    var index = -1;
    for (var idx = 0; idx < streams.length; idx += 1) {
        if (!streams[idx].removed) {
            index += 1;
        }
        if (streams[idx].index === stream.index) {
            break;
        }
    }
    return index;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var lib = require('../../../../../methods/lib')();
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var _a = args.inputs, subtitleLanguages = _a.subtitleLanguages, configExtractPath = _a.extractPath;
    var subtitleLangs = String(subtitleLanguages).trim().split(',');
    (0, flowUtils_1.checkFfmpegCommandInit)(args);
    var extractPath = configExtractPath;
    if (!extractPath) {
        var path = require('path');
        var inputDir = path.dirname(args.inputFileObj.file);
        var inputName = path.parse(args.inputFileObj.file).name;
        extractPath = path.join(inputDir, "".concat(inputName, "_subs"));
    }
    args.deps.fsextra.ensureDirSync(extractPath);
    // Cast variables to our extended interface
    var extendedVars = args.variables;
    // Add extractionStreams property to ffmpegCommand if it doesn't exist
    if (typeof extendedVars.ffmpegCommand.extractionStreams === 'undefined') {
        Object.defineProperty(extendedVars.ffmpegCommand, 'extractionStreams', {
            value: [],
            writable: true,
            enumerable: true,
            configurable: true,
        });
    }
    var streams = extendedVars.ffmpegCommand.streams;
    var extractedCount = 0;
    streams.forEach(function (stream) {
        var _a;
        if (stream.codec_type === 'subtitle') {
            var format = stream.codec_name.toLowerCase();
            var lang = ((_a = stream.tags) === null || _a === void 0 ? void 0 : _a.language) ? stream.tags.language : 'und';
            if ((format === 'ass' || format === 'subrip' || format === 'srt')
                && (subtitleLangs.length === 0 || subtitleLangs.includes(lang))) {
                if (Object.prototype.hasOwnProperty.call(stream, 'disposition')) {
                    var def = stream.disposition.default === 1 ? '.default' : '';
                    var forced = stream.disposition.forced === 1 ? '.forced' : '';
                    var sdh = stream.disposition.hearing_impaired === 1 ? '.sdh' : '';
                    lang = "".concat(lang).concat(def).concat(forced).concat(sdh);
                }
                var index = getOutputStreamIndex(streams, stream);
                var outputPath = "".concat(extractPath, "/").concat(index, ".").concat(lang, ".srt");
                // Create a copy of the stream for extraction
                var extractStream = __assign({}, stream);
                extractStream.outputArgs = [];
                extractStream.outputArgs.push('-c:s:0');
                if (format === 'ass') {
                    extractStream.outputArgs.push('srt');
                }
                else if (format === 'subrip' || format === 'srt') {
                    extractStream.outputArgs.push('copy');
                }
                extractStream.outputArgs.push(outputPath);
                // Add to extraction streams
                extendedVars.ffmpegCommand.extractionStreams.push(extractStream);
                extractedCount += 1;
                args.jobLog("\u2611 Will extract subtitle stream ".concat(index, " (").concat(lang, ") to ").concat(outputPath));
            }
        }
    });
    if (extractedCount === 0) {
        args.jobLog('☒ No subtitles found matching the specified languages for extraction');
    }
    else {
        args.jobLog("\u2611 Will extract ".concat(extractedCount, " subtitle streams to ").concat(extractPath));
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};
exports.plugin = plugin;
