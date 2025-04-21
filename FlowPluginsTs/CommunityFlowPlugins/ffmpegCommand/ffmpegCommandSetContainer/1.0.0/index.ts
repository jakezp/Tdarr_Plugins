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
  name: 'Set Container',
  description: `
  Set the output container format for the file.
  
  This plugin sets the container format (MP4/MKV) for the output file.
  It works between ffmpegCommandStart and ffmpegCommandExecute.
  `,
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
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args:IpluginInputArgs):IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);
  const containerFormat = String(args.inputs.containerFormat).toLowerCase();
  const forceRemux = args.inputs.forceRemux === 'true';

  // Check if ffmpegCommand is initialized
  checkFfmpegCommandInit(args);

  // Get current container format
  const currentContainer = args.inputFileObj.container.toLowerCase();

  // Check if remux is needed
  const needsRemux = forceRemux || currentContainer !== containerFormat;

  if (!needsRemux) {
    args.jobLog(`☑ File is already in ${containerFormat} format, no remux needed`);
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: args.variables,
    };
  }

  // Cast variables to our extended interface
  const extendedVars = args.variables as ExtendedVariables;

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
    const videoStreams = extendedVars.ffmpegCommand.streams.filter(
      (s) => s.codec_type === 'video' && !s.removed,
    );

    videoStreams.forEach((stream) => {
      if (stream.codec_name.toLowerCase() === 'hevc') {
        if (!stream.outputArgs) {
          stream.outputArgs = [];
        }

        // Add hevc_mp4toannexb bitstream filter for HEVC streams
        stream.outputArgs.push('-bsf:v', 'hevc_mp4toannexb');
      }
    });

    args.jobLog('☑ Setting container format to MP4 with faststart and Dolby Vision support');
  } else {
    args.jobLog(`☑ Setting container format to ${containerFormat.toUpperCase()}`);
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
