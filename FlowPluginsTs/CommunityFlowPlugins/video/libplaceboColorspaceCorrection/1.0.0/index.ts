import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName, getPluginWorkDir } from '../../../../FlowHelpers/1.0.0/fileUtils';
import details from './details';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Parse input parameters
  const colorspace = String(args.inputs.colorspace);
  const colorPrimaries = String(args.inputs.colorPrimaries);
  const colorTrc = String(args.inputs.colorTrc);
  const tonemapping = String(args.inputs.tonemapping);
  const applyDolbyVision = String(args.inputs.applyDolbyVision) === 'true';
  const gamutMode = String(args.inputs.gamutMode);
  const contrastRecovery = String(args.inputs.contrastRecovery);
  const tonemappingLutSize = String(args.inputs.tonemappingLutSize);
  const videoCodec = String(args.inputs.videoCodec);
  const encodingPreset = String(args.inputs.encodingPreset);
  const cqValue = String(args.inputs.cqValue);

  // Initialize response for cases where no processing is needed
  const noProcessingResponse = {
    outputFileObj: {
      _id: args.inputFileObj._id,
    },
    outputNumber: 1,
    variables: args.variables,
  };

  // Basic File Checks
  if (!args.inputFileObj || !args.inputFileObj.ffProbeData || !Array.isArray(args.inputFileObj.ffProbeData.streams)) {
    args.jobLog('☒ File or stream data is missing. Skipping plugin.');
    return noProcessingResponse;
  }

  if (args.inputFileObj.fileMedium !== 'video') {
    args.jobLog('☒ File is not a video. Skipping plugin.');
    return noProcessingResponse;
  }

  args.jobLog('☑ File is a video. Starting libplacebo colorspace correction...');

  // Determine output container
  const outputContainer = 'mkv'; // Always use MKV for output to ensure compatibility

  // Build FFmpeg command
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.${outputContainer}`;

  // Build the libplacebo filter string
  let libplaceboFilter = 'libplacebo=';
  libplaceboFilter += `colorspace=${colorspace}:`;
  libplaceboFilter += `color_primaries=${colorPrimaries}:`;
  libplaceboFilter += `color_trc=${colorTrc}:`;
  libplaceboFilter += `tonemapping=${tonemapping}`;

  if (applyDolbyVision) {
    libplaceboFilter += ':apply_dolbyvision=true';
  }

  libplaceboFilter += `:gamut_mode=${gamutMode}:`;
  libplaceboFilter += `contrast_recovery=${contrastRecovery}:`;
  libplaceboFilter += `tonemapping_lut_size=${tonemappingLutSize}`;

  // Start building the command parts
  const cliArgs: string[] = [];

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
  } else {
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
  args.jobLog(`☑ Applying libplacebo colorspace correction with filter: ${libplaceboFilter}`);
  args.jobLog(`☑ Using video codec: ${videoCodec} with quality setting: ${cqValue}`);

  // Update worker with CLI info
  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: cliArgs.join(' '),
  });

  // Execute FFmpeg command
  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath,
    inputFileObj: args.inputFileObj,
    logFullCliOutput: args.logFullCliOutput,
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 0) {
    args.jobLog(`Running FFmpeg failed with exit code ${res.cliExitCode}`);
    throw new Error(`Running FFmpeg failed with exit code ${res.cliExitCode}`);
  }

  args.logOutcome('tSuc');

  return {
    outputFileObj: {
      _id: outputFilePath,
    },
    outputNumber: 1,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
