/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommandStream,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

/* eslint-disable no-param-reassign */
const details = ():IpluginDetails => ({
  name: 'Standardize Audio',
  description: `
  Standardize audio streams to AC3 format with specified language.
  
  This plugin:
  1. Keeps only one audio stream in the specified language
  2. Converts the audio to AC3 format if it's not already
  3. Downmixes audio channels > 6 to 5.1
  
  It works between ffmpegCommandStart and ffmpegCommandExecute.
  `,
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
});

// Helper function to get the channel count from an audio stream
const getChannelCount = (stream: IffmpegCommandStream): number => {
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
const getBestAudioStream = (streams: IffmpegCommandStream[], language: string): IffmpegCommandStream | null => {
  // First try to find a stream with the specified language
  const langStreams = streams.filter(
    (s) => s.codec_type === 'audio' && s.tags?.language === language,
  );

  if (langStreams.length > 0) {
    // Sort by channel count (highest first)
    return langStreams.sort((a, b) => getChannelCount(b) - getChannelCount(a))[0];
  }

  // If no stream with the specified language, try to find any audio stream
  const audioStreams = streams.filter((s) => s.codec_type === 'audio');
  if (audioStreams.length > 0) {
    // Sort by channel count (highest first)
    return audioStreams.sort((a, b) => getChannelCount(b) - getChannelCount(a))[0];
  }

  return null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const audioLanguage = String(args.inputs.audioLanguage);
  const bitrate = String(args.inputs.bitrate);
  const keepOnlyOne = args.inputs.keepOnlyOne === 'true';

  // Check if ffmpegCommand is initialized
  checkFfmpegCommandInit(args);

  const { streams } = args.variables.ffmpegCommand;

  // Find the best audio stream
  const bestAudioStream = getBestAudioStream(streams, audioLanguage);

  if (!bestAudioStream) {
    args.jobLog('☒ No audio streams found');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Process audio streams
  streams.forEach((stream) => {
    if (stream.codec_type === 'audio') {
      // If keepOnlyOne is true, remove all streams except the best one
      if (keepOnlyOne && stream.index !== bestAudioStream.index) {
        stream.removed = true;
        args.jobLog(`☑ Removing audio stream ${stream.index}`);
        return;
      }

      // If this is the best stream, check if it needs conversion
      if (stream.index === bestAudioStream.index) {
        const channelCount = getChannelCount(stream);
        const needsDownmix = channelCount > 6;
        const isAc3 = stream.codec_name.toLowerCase() === 'ac3';

        // If already AC3 and doesn't need downmix, just keep it
        if (isAc3 && !needsDownmix) {
          args.jobLog(`☑ Keeping AC3 audio stream ${stream.index} (${channelCount} channels)`);
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
          args.jobLog(
            `☑ Converting audio stream ${stream.index} to AC3 and downmixing from ${channelCount} to 5.1`,
          );
        } else {
          args.jobLog(`☑ Converting audio stream ${stream.index} to AC3 (${channelCount} channels)`);
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

export {
  details,
  plugin,
};
