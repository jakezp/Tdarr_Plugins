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
var details_1 = __importDefault(require("./details"));
exports.details = details_1.default;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, noDoviResponse, cliArgs, cli, res, output, doviMatch, profileNumber, outputNumber;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details_1.default);
                noDoviResponse = {
                    outputFileObj: {
                        _id: args.inputFileObj._id,
                    },
                    outputNumber: 5,
                    variables: args.variables,
                };
                // Basic File Checks
                if (!args.inputFileObj || !args.inputFileObj.ffProbeData) {
                    args.jobLog('☒ File or ffProbe data is missing. Skipping plugin.');
                    return [2 /*return*/, noDoviResponse];
                }
                if (args.inputFileObj.fileMedium !== 'video') {
                    args.jobLog('☒ File is not a video. Skipping plugin.');
                    return [2 /*return*/, noDoviResponse];
                }
                args.jobLog('☑ File is a video. Starting Dolby Vision detection...');
                cliArgs = [
                    '-i', args.inputFileObj._id,
                    '-hide_banner',
                    '-loglevel', 'info',
                ];
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
                    outputFilePath: '',
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: true,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                res = _a.sent();
                if (res.cliExitCode !== 1) {
                    // FFmpeg returns exit code 1 when used for information only, so this is actually an error
                    args.jobLog("Running FFmpeg failed with unexpected exit code ".concat(res.cliExitCode));
                    return [2 /*return*/, noDoviResponse];
                }
                output = res.errorLogFull.join('\n') || '';
                doviMatch = output.match(/DOVI configuration record: version: \d+\.\d+, profile: (\d+)/);
                if (!doviMatch) {
                    args.jobLog('☒ No Dolby Vision configuration record found. File is SDR or HDR10/HDR10+.');
                    return [2 /*return*/, noDoviResponse];
                }
                profileNumber = parseInt(doviMatch[1], 10);
                args.jobLog("\u2611 Dolby Vision detected! Profile: ".concat(profileNumber));
                outputNumber = 5;
                switch (profileNumber) {
                    case 4:
                        outputNumber = 1;
                        args.jobLog('☑ Detected Dolby Vision Profile 4');
                        break;
                    case 5:
                        outputNumber = 2;
                        args.jobLog('☑ Detected Dolby Vision Profile 5');
                        break;
                    case 7:
                        outputNumber = 3;
                        args.jobLog('☑ Detected Dolby Vision Profile 7');
                        break;
                    case 8:
                        outputNumber = 4;
                        args.jobLog('☑ Detected Dolby Vision Profile 8');
                        break;
                    default:
                        // Unsupported profile, treat as SDR
                        args.jobLog("\u2612 Unsupported Dolby Vision profile: ".concat(profileNumber, ". Treating as SDR."));
                        return [2 /*return*/, noDoviResponse];
                }
                // Return the result with the appropriate output number
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: args.inputFileObj._id,
                        },
                        outputNumber: outputNumber,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
