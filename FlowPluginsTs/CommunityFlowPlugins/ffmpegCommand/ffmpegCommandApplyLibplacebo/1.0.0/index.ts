/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */

import { checkFfmpegCommandInit } from '../../../../FlowHelpers/1.0.0/interfaces/flowUtils';
import {
  IffmpegCommand,
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

// Define an extended variables interface
interface ExtendedVariables extends Ivariables {
  ffmpegCommand: IffmpegCommand & {
    outputArgs?: string[];
  };
}

/* eslint-disable no-param-reassign */
const details = ():IpluginDetails => ({
  name: 'Apply Libplacebo',
  description: `
  Apply libplacebo filter for HDR/Dolby Vision to SDR conversion.
  
  This plugin applies the libplacebo filter to convert HDR/Dolby Vision content to SDR.
  It works between ffmpegCommandStart and ffmpegCommandExecute.
  `,
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
          '0', // clip
          '1', // mobius
          '2', // reinhard
          '3', // hable
          '4', // bt2390
          '5', // gamma
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
          '0', // clip
          '1', // perceptual
          '2', // relative
          '3', // saturation
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
          'p1', // slowest/best quality
          'p2',
          'p3',
          'p4',
          'p5',
          'p6',
          'p7', // fastest/worst quality
          'medium', // for CPU encoders
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Extract input parameters
  const colorspace = String(args.inputs.colorspace);
  const colorPrimaries = String(args.inputs.colorPrimaries);
  const colorTransfer = String(args.inputs.colorTransfer);
  const tonemapping = String(args.inputs.tonemapping);
  const applyDolbyVision = args.inputs.applyDolbyVision === 'true';
  const gamutMode = String(args.inputs.gamutMode);
  const contrastRecovery = String(args.inputs.contrastRecovery);
  const tonemappingLutSize = String(args.inputs.tonemappingLutSize);
  const videoCodec = String(args.inputs.videoCodec);
  const encodingPreset = String(args.inputs.encodingPreset);
  const cqValue = String(args.inputs.cqValue);

  // Check if ffmpegCommand is initialized
  checkFfmpegCommandInit(args);

  // Cast variables to our extended interface
  const extendedVars = args.variables as ExtendedVariables;

  // Find video stream
  const videoStreams = extendedVars.ffmpegCommand.streams.filter(
    (s) => s.codec_type === 'video' && !s.removed,
  );

  if (videoStreams.length === 0) {
    args.jobLog('☒ No video streams found');
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Process the first video stream
  const videoStream = videoStreams[0];

  // Build libplacebo filter string
  let libplaceboFilter = 'libplacebo=';
  libplaceboFilter += `colorspace=${colorspace}:`;
  libplaceboFilter += `color_primaries=${colorPrimaries}:`;
  libplaceboFilter += `color_trc=${colorTransfer}:`;
  libplaceboFilter += `tonemapping=${tonemapping}`;

  // Add optional parameters
  libplaceboFilter += `:apply_dolbyvision=${applyDolbyVision ? 'true' : 'false'}`;
  libplaceboFilter += `:gamut_mode=${gamutMode}`;
  libplaceboFilter += `:contrast_recovery=${contrastRecovery}`;
  libplaceboFilter += `:tonemapping_lut_size=${tonemappingLutSize}`;

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
  } else {
    videoStream.outputArgs.push('-crf');
  }
  videoStream.outputArgs.push(cqValue);

  // Mark for processing
  extendedVars.ffmpegCommand.shouldProcess = true;

  args.jobLog(`☑ Applied libplacebo filter for HDR/Dolby Vision to SDR conversion using ${videoCodec}`);

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
