"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details_1 = __importDefault(require("./details"));
exports.details = details_1.default;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, keepOnlyEnglishAC3, removeNonEnglishSubs, convertToMkv, noProcessingResponse, needsProcessing, streams, audioStreams, subtitleStreams, preferredAudioStream, bestEnglishAudioStream, targetAudioStreamIndex, sourceAudioStreamForConversion, streamsToRemove, audioMapCommand, audioCodecCommand, typedSource, targetChannels, englishSubtitleIndices, subtitleMapCommands, needsContainerConversion, outputFilePath, videoMapCommand, cliArgs, finalStreamsToRemove, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details_1.default);
                keepOnlyEnglishAC3 = String(args.inputs.keepOnlyEnglishAC3) === 'true';
                removeNonEnglishSubs = String(args.inputs.removeNonEnglishSubs) === 'true';
                convertToMkv = String(args.inputs.convertToMkv) === 'true';
                noProcessingResponse = {
                    outputFileObj: {
                        _id: args.inputFileObj._id,
                    },
                    outputNumber: 1,
                    variables: args.variables,
                };
                // Basic File Checks
                if (!args.inputFileObj || !args.inputFileObj.ffProbeData || !Array.isArray(args.inputFileObj.ffProbeData.streams)) {
                    args.jobLog('☒ File or stream data is missing. Skipping plugin.');
                    return [2 /*return*/, noProcessingResponse];
                }
                if (args.inputFileObj.fileMedium !== 'video') {
                    args.jobLog('☒ File is not a video. Skipping plugin.');
                    return [2 /*return*/, noProcessingResponse];
                }
                args.jobLog('☑ File is a video. Starting analysis...');
                needsProcessing = false;
                streams = args.inputFileObj.ffProbeData.streams;
                audioStreams = [];
                subtitleStreams = [];
                streams.forEach(function (stream, index) {
                    if (stream.codec_type === 'audio') {
                        var language = (stream.tags && stream.tags.language) ? String(stream.tags.language).toLowerCase() : 'und';
                        audioStreams.push({
                            index: index,
                            codec: String(stream.codec_name).toLowerCase(),
                            language: language,
                            channels: stream.channels || 0,
                        });
                    }
                    else if (stream.codec_type === 'subtitle') {
                        var language = (stream.tags && stream.tags.language) ? String(stream.tags.language).toLowerCase() : 'und';
                        subtitleStreams.push({
                            index: index,
                            language: language,
                        });
                    }
                });
                args.jobLog("\u2611 Found ".concat(audioStreams.length, " audio stream(s) and ").concat(subtitleStreams.length, " subtitle stream(s)."));
                preferredAudioStream = null;
                bestEnglishAudioStream = null;
                targetAudioStreamIndex = -1;
                sourceAudioStreamForConversion = null;
                streamsToRemove = [];
                // Find preferred (Eng AC3 5.1) and best alternative English stream
                if (keepOnlyEnglishAC3) {
                    audioStreams.forEach(function (stream) {
                        if (stream.language.includes('eng')) {
                            if (stream.codec === 'ac3' && stream.channels === 6) {
                                if (!preferredAudioStream) { // Take the first Eng AC3 5.1 found
                                    preferredAudioStream = stream;
                                    args.jobLog("\u2611 Found preferred English AC3 5.1 audio stream at index ".concat(stream.index, "."));
                                }
                            }
                            // Track the best English stream overall (highest channels)
                            if (!bestEnglishAudioStream || stream.channels > bestEnglishAudioStream.channels) {
                                bestEnglishAudioStream = stream;
                            }
                        }
                    });
                }
                audioMapCommand = '';
                audioCodecCommand = '';
                if (keepOnlyEnglishAC3) {
                    if (preferredAudioStream !== null) {
                        // Keep the preferred stream, mark others for removal
                        targetAudioStreamIndex = preferredAudioStream.index;
                        audioMapCommand = "-map 0:".concat(targetAudioStreamIndex);
                        audioCodecCommand = '-c:a copy'; // Keep original codec
                        args.jobLog("\u2611 Keeping English AC3 5.1 stream (index ".concat(targetAudioStreamIndex, ")."));
                        // Mark all other audio streams for removal
                        audioStreams.forEach(function (stream) {
                            if (stream.index !== targetAudioStreamIndex) {
                                streamsToRemove.push(stream.index);
                            }
                        });
                        if (streamsToRemove.length > 0) {
                            needsProcessing = true;
                            args.jobLog("\u2611 Marking ".concat(streamsToRemove.length, " other audio stream(s) for removal."));
                        }
                    }
                    else if (bestEnglishAudioStream !== null) {
                        // Convert the best English stream, mark others for removal
                        targetAudioStreamIndex = bestEnglishAudioStream.index;
                        sourceAudioStreamForConversion = bestEnglishAudioStream;
                        audioMapCommand = "-map 0:".concat(targetAudioStreamIndex);
                        // Ensure sourceAudioStreamForConversion is not null before accessing its properties
                        if (sourceAudioStreamForConversion !== null) {
                            typedSource = sourceAudioStreamForConversion;
                            args.jobLog('☒ No English AC3 5.1 stream found. Selecting best English stream '
                                + "(index ".concat(targetAudioStreamIndex, ", ").concat(typedSource.codec, ", ").concat(typedSource.channels, "ch) for conversion."));
                            targetChannels = typedSource.channels;
                            if (targetChannels > 6) {
                                targetChannels = 6;
                                args.jobLog("\u2611 Downmixing audio to 5.1 (".concat(targetChannels, " channels)."));
                            }
                            else if (targetChannels === 4 || targetChannels === 5 || targetChannels === 7) {
                                // Handle unsupported AC3 channel layouts by downmixing common cases
                                if (targetChannels === 4)
                                    targetChannels = 2; // Quad -> Stereo
                                if (targetChannels === 5)
                                    targetChannels = 6; // 5.0 -> 5.1 (might need specific mapping later if problematic)
                                if (targetChannels === 7)
                                    targetChannels = 6; // 6.1 -> 5.1
                                args.jobLog('☑ Adjusting unsupported channel count '
                                    + "(".concat(typedSource.channels, ") to ").concat(targetChannels, " for AC3 conversion."));
                            }
                            else {
                                args.jobLog("\u2611 Keeping original channel count (".concat(targetChannels, ") for AC3 conversion."));
                            }
                            // The output audio stream index will always be 0 since we only map one audio stream
                            audioCodecCommand = "-c:a:0 ac3 -ac ".concat(targetChannels); // Convert to AC3 with target channels
                        }
                        else {
                            // Default to 2 channels if sourceAudioStreamForConversion is null (shouldn't happen)
                            audioCodecCommand = '-c:a:0 ac3 -ac 2';
                        }
                        needsProcessing = true; // Conversion requires processing
                        // Mark all other audio streams for removal
                        audioStreams.forEach(function (stream) {
                            if (stream.index !== targetAudioStreamIndex) {
                                streamsToRemove.push(stream.index);
                            }
                        });
                        if (streamsToRemove.length > 0) {
                            args.jobLog("\u2611 Marking ".concat(streamsToRemove.length, " other audio stream(s) for removal."));
                        }
                        else if (audioStreams.length > 1) {
                            // This case shouldn't happen if bestEnglishAudioStream logic is correct, but good to log
                            args.jobLog('⚠ Warning: Only one audio stream found, but it needs conversion.');
                        }
                    }
                    else {
                        // No English audio found, keep all existing audio streams
                        args.jobLog('☒ No English audio stream found. Skipping audio processing.');
                        // Map all existing audio streams
                        audioMapCommand = '-map 0:a?';
                        audioCodecCommand = '-c:a copy';
                    }
                }
                else {
                    // Not keeping only English AC3, so copy all audio streams
                    audioMapCommand = '-map 0:a?';
                    audioCodecCommand = '-c:a copy';
                    args.jobLog('☑ Keeping all audio streams as requested.');
                }
                englishSubtitleIndices = [];
                subtitleMapCommands = [];
                if (removeNonEnglishSubs) {
                    subtitleStreams.forEach(function (stream) {
                        if (stream.language.includes('eng')) {
                            englishSubtitleIndices.push(stream.index);
                            args.jobLog("\u2611 Keeping English subtitle stream (index ".concat(stream.index, ")."));
                        }
                        else {
                            streamsToRemove.push(stream.index);
                            needsProcessing = true;
                            args.jobLog("\u2612 Removing non-English subtitle stream (index ".concat(stream.index, ", lang: ").concat(stream.language, ")."));
                        }
                    });
                    // Build subtitle map command based on remaining English subs
                    if (englishSubtitleIndices.length > 0) {
                        subtitleMapCommands = englishSubtitleIndices.map(function (idx) { return "-map 0:".concat(idx); });
                    }
                    else {
                        subtitleMapCommands = ['-map -0:s?']; // Explicitly remove all subs if none are English
                        if (subtitleStreams.length > 0) {
                            args.jobLog('☑ No English subtitles found to keep.');
                        }
                    }
                }
                else {
                    // Keep all subtitle streams
                    subtitleMapCommands = ['-map 0:s?'];
                    args.jobLog('☑ Keeping all subtitle streams as requested.');
                }
                needsContainerConversion = convertToMkv && args.inputFileObj.container !== 'mkv';
                if (needsContainerConversion) {
                    needsProcessing = true;
                }
                // If no processing is needed, return early
                if (!needsProcessing && !needsContainerConversion) {
                    args.jobLog('☑ File does not require processing by this plugin.');
                    return [2 /*return*/, noProcessingResponse];
                }
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".mkv");
                videoMapCommand = '-map 0:v?';
                cliArgs = [];
                // Input file
                cliArgs.push('-i', args.inputFileObj._id);
                // Mapping commands in the desired order: Video, Target Audio, English Subtitles
                cliArgs.push.apply(cliArgs, videoMapCommand.split(' '));
                if (audioMapCommand) {
                    cliArgs.push.apply(cliArgs, audioMapCommand.split(' '));
                }
                // Only add subtitle maps if there are English subs to keep
                if (englishSubtitleIndices.length > 0 && subtitleMapCommands.length > 0
                    && subtitleMapCommands[0] !== '-map -0:s?') {
                    subtitleMapCommands.forEach(function (cmd) {
                        cliArgs.push.apply(cliArgs, cmd.split(' '));
                    });
                }
                else if (subtitleMapCommands[0] === '-map -0:s?') {
                    cliArgs.push.apply(cliArgs, subtitleMapCommands[0].split(' '));
                }
                else if (!removeNonEnglishSubs) {
                    cliArgs.push.apply(cliArgs, subtitleMapCommands[0].split(' '));
                }
                finalStreamsToRemove = streamsToRemove.filter(function (idx) { return idx !== targetAudioStreamIndex; });
                if (finalStreamsToRemove.length > 0) {
                    finalStreamsToRemove.forEach(function (idx) {
                        cliArgs.push('-map', "-0:".concat(idx));
                    });
                    args.jobLog("\u2611 Final removal map: ".concat(finalStreamsToRemove.map(function (idx) { return "-map -0:".concat(idx); }).join(' ')));
                }
                // Add codec commands
                cliArgs.push('-c:v', 'copy'); // Copy video codec
                if (audioCodecCommand) {
                    cliArgs.push.apply(cliArgs, audioCodecCommand.split(' ')); // Copy or convert audio codec
                }
                // Only copy subtitles if we are keeping any English ones
                if (englishSubtitleIndices.length > 0 || !removeNonEnglishSubs) {
                    cliArgs.push('-c:s', 'copy');
                }
                // Add stability flag
                cliArgs.push('-max_muxing_queue_size', '9999');
                // Output file
                cliArgs.push(outputFilePath);
                // Log the final command
                args.jobLog("\u2611 File requires processing. Final command args: ".concat(cliArgs.join(' ')));
                if (needsContainerConversion) {
                    args.jobLog('☑ File container is not MKV. Will be remuxed to MKV during processing.');
                }
                else {
                    args.jobLog('☑ File is already MKV. Proceeding with audio/subtitle processing.');
                }
                // Update worker with CLI info
                args.updateWorker({
                    CLIType: args.ffmpegPath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: args.ffmpegPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 0) {
                    args.jobLog("Running FFmpeg failed with exit code ".concat(res.cliExitCode));
                    throw new Error("Running FFmpeg failed with exit code ".concat(res.cliExitCode));
                }
                args.logOutcome('tSuc');
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: outputFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
