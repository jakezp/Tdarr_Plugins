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
    var lib, colorspace, colorPrimaries, colorTrc, tonemapping, applyDolbyVision, gamutMode, contrastRecovery, tonemappingLutSize, videoCodec, encodingPreset, cqValue, noProcessingResponse, outputContainer, outputFilePath, libplaceboFilter, cliArgs, cli, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details_1.default);
                colorspace = String(args.inputs.colorspace);
                colorPrimaries = String(args.inputs.colorPrimaries);
                colorTrc = String(args.inputs.colorTrc);
                tonemapping = String(args.inputs.tonemapping);
                applyDolbyVision = String(args.inputs.applyDolbyVision) === 'true';
                gamutMode = String(args.inputs.gamutMode);
                contrastRecovery = String(args.inputs.contrastRecovery);
                tonemappingLutSize = String(args.inputs.tonemappingLutSize);
                videoCodec = String(args.inputs.videoCodec);
                encodingPreset = String(args.inputs.encodingPreset);
                cqValue = String(args.inputs.cqValue);
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
                args.jobLog('☑ File is a video. Starting libplacebo colorspace correction...');
                outputContainer = 'mkv';
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".").concat(outputContainer);
                libplaceboFilter = 'libplacebo=';
                libplaceboFilter += "colorspace=".concat(colorspace, ":");
                libplaceboFilter += "color_primaries=".concat(colorPrimaries, ":");
                libplaceboFilter += "color_trc=".concat(colorTrc, ":");
                libplaceboFilter += "tonemapping=".concat(tonemapping);
                if (applyDolbyVision) {
                    libplaceboFilter += ':apply_dolbyvision=true';
                }
                libplaceboFilter += ":gamut_mode=".concat(gamutMode, ":");
                libplaceboFilter += "contrast_recovery=".concat(contrastRecovery, ":");
                libplaceboFilter += "tonemapping_lut_size=".concat(tonemappingLutSize);
                cliArgs = [];
                // Input file
                cliArgs.push('-i', args.inputFileObj._id);
                // Map streams
                cliArgs.push('-map', '0:v'); // Map video stream
                cliArgs.push('-map', '0:a?'); // Map all audio streams if present
                cliArgs.push('-map', '0:s?'); // Map all subtitle streams if present
                // Apply libplacebo filter to video
                cliArgs.push('-vf', libplaceboFilter);
                // Set video codec and encoding parameters
                cliArgs.push('-c:v', videoCodec);
                // Add codec-specific parameters
                if (videoCodec.includes('nvenc')) {
                    cliArgs.push('-preset', encodingPreset);
                    cliArgs.push('-cq', cqValue);
                }
                else {
                    // For libx264/libx265
                    cliArgs.push('-crf', cqValue);
                    cliArgs.push('-preset', 'medium'); // Default preset for CPU encoding
                }
                // Copy audio and subtitle streams
                cliArgs.push('-c:a', 'copy');
                cliArgs.push('-c:s', 'copy');
                // Add stability flag
                cliArgs.push('-max_muxing_queue_size', '9999');
                // Output file
                cliArgs.push(outputFilePath);
                // Log the final command
                args.jobLog("\u2611 Applying libplacebo colorspace correction with filter: ".concat(libplaceboFilter));
                args.jobLog("\u2611 Using video codec: ".concat(videoCodec, " with quality setting: ").concat(cqValue));
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
