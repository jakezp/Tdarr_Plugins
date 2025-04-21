/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommand,
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

// Define an extended ffmpegCommand interface
interface ExtendedFfmpegCommand extends IffmpegCommand {
  extractionStreams?: IffmpegCommandStream[];
}

// Define an extended variables interface
interface ExtendedVariables extends Ivariables {
  ffmpegCommand: ExtendedFfmpegCommand;
}

/* eslint-disable no-param-reassign */
const details = ():IpluginDetails => ({
  name: 'Extract Subtitles',
  description: `
  Extract subtitles to SRT files alongside the video file.
  
  This plugin only extracts subtitles without affecting other streams.
  It works between ffmpegCommandStart and ffmpegCommandExecute.
  `,
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
});

const getOutputStreamIndex = (streams: IffmpegCommandStream[], stream: IffmpegCommandStream): number => {
  let index = -1;

  for (let idx = 0; idx < streams.length; idx += 1) {
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
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const { subtitleLanguages, extractPath: configExtractPath } = args.inputs;
  const subtitleLangs = String(subtitleLanguages).trim().split(',');

  checkFfmpegCommandInit(args);

  let extractPath = configExtractPath;
  if (!extractPath) {
    const path = require('path');
    const inputDir = path.dirname(args.inputFileObj.file);
    const inputName = path.parse(args.inputFileObj.file).name;
    extractPath = path.join(inputDir, `${inputName}_subs`);
  }

  args.deps.fsextra.ensureDirSync(extractPath);

  // Cast variables to our extended interface
  const extendedVars = args.variables as ExtendedVariables;

  // Add extractionStreams property to ffmpegCommand if it doesn't exist
  if (typeof extendedVars.ffmpegCommand.extractionStreams === 'undefined') {
    Object.defineProperty(extendedVars.ffmpegCommand, 'extractionStreams', {
      value: [],
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  const { streams } = extendedVars.ffmpegCommand;
  let extractedCount = 0;

  streams.forEach((stream) => {
    if (stream.codec_type === 'subtitle') {
      const format = stream.codec_name.toLowerCase();
      let lang = stream.tags?.language ? stream.tags.language : 'und';

      if (
        (format === 'ass' || format === 'subrip' || format === 'srt')
        && (subtitleLangs.length === 0 || subtitleLangs.includes(lang))
      ) {
        if (Object.prototype.hasOwnProperty.call(stream, 'disposition')) {
          const def = stream.disposition.default === 1 ? '.default' : '';
          const forced = stream.disposition.forced === 1 ? '.forced' : '';
          const sdh = stream.disposition.hearing_impaired === 1 ? '.sdh' : '';
          lang = `${lang}${def}${forced}${sdh}`;
        }

        const index = getOutputStreamIndex(streams, stream);
        const outputPath = `${extractPath}/${index}.${lang}.srt`;

        // Create a copy of the stream for extraction
        const extractStream = { ...stream };
        extractStream.outputArgs = [];
        extractStream.outputArgs.push('-c:s:0');

        if (format === 'ass') {
          extractStream.outputArgs.push('srt');
        } else if (format === 'subrip' || format === 'srt') {
          extractStream.outputArgs.push('copy');
        }

        extractStream.outputArgs.push(outputPath);

        // Add to extraction streams
        (extendedVars.ffmpegCommand.extractionStreams as IffmpegCommandStream[]).push(extractStream);
        extractedCount += 1;

        args.jobLog(`☑ Will extract subtitle stream ${index} (${lang}) to ${outputPath}`);
      }
    }
  });

  if (extractedCount === 0) {
    args.jobLog('☒ No subtitles found matching the specified languages for extraction');
  } else {
    args.jobLog(`☑ Will extract ${extractedCount} subtitle streams to ${extractPath}`);
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
