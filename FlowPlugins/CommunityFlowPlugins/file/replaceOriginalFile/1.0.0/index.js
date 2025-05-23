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
var fs_1 = require("fs");
var fileMoveOrCopy_1 = __importDefault(require("../../../../FlowHelpers/1.0.0/fileMoveOrCopy"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Replace Original File',
    description: "\n  Replace the original file with the 'working' file passed into this plugin. \n  If the file hasn't changed then no action is taken.\n  Note: The 'working' filename and container will replace the original filename and container.\n  ",
    style: {
        borderColor: 'green',
    },
    tags: '',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faArrowRight',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, currentPath, orignalFolder, fileName, container, newPath, newPathTmp, originalFileExists, currentFileIsNotOriginal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                lib = require('../../../../../methods/lib')();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
                args.inputs = lib.loadDefaultValues(args.inputs, details);
                if (args.inputFileObj._id === args.originalLibraryFile._id
                    && args.inputFileObj.file_size === args.originalLibraryFile.file_size) {
                    args.jobLog('File has not changed, no need to replace file');
                    return [2 /*return*/, {
                            outputFileObj: args.inputFileObj,
                            outputNumber: 1,
                            variables: args.variables,
                        }];
                }
                args.jobLog('File has changed, replacing original file');
                currentPath = args.inputFileObj._id;
                orignalFolder = (0, fileUtils_1.getFileAbosluteDir)(args.originalLibraryFile._id);
                fileName = (0, fileUtils_1.getFileName)(args.inputFileObj._id);
                container = (0, fileUtils_1.getContainer)(args.inputFileObj._id);
                newPath = "".concat(orignalFolder, "/").concat(fileName, ".").concat(container);
                newPathTmp = "".concat(newPath, ".tmp");
                args.jobLog(JSON.stringify({
                    currentPath: currentPath,
                    newPath: newPath,
                    newPathTmp: newPathTmp,
                }));
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: currentPath,
                        destinationPath: newPathTmp,
                        args: args,
                    })];
            case 2:
                _a.sent();
                return [4 /*yield*/, (0, fileUtils_1.fileExists)(args.originalLibraryFile._id)];
            case 3:
                originalFileExists = _a.sent();
                currentFileIsNotOriginal = args.originalLibraryFile._id !== currentPath;
                args.jobLog(JSON.stringify({
                    originalFileExists: originalFileExists,
                    currentFileIsNotOriginal: currentFileIsNotOriginal,
                }));
                if (!(originalFileExists
                    && currentFileIsNotOriginal)) return [3 /*break*/, 5];
                args.jobLog("Deleting original file:".concat(args.originalLibraryFile._id));
                return [4 /*yield*/, fs_1.promises.unlink(args.originalLibraryFile._id)];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
            case 6:
                _a.sent();
                return [4 /*yield*/, (0, fileMoveOrCopy_1.default)({
                        operation: 'move',
                        sourcePath: newPathTmp,
                        destinationPath: newPath,
                        args: args,
                    })];
            case 7:
                _a.sent();
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: newPath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
        }
    });
}); };
exports.plugin = plugin;
