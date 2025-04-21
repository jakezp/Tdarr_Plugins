import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import details from './details';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Initialize response for cases where no processing is needed
  const noDoviResponse = {
    outputFileObj: {
      _id: args.inputFileObj._id,
    },
    outputNumber: 5, // No DolbyVision/SDR
    variables: args.variables,
  };

  // Basic File Checks
  if (!args.inputFileObj || !args.inputFileObj.ffProbeData) {
    args.jobLog('☒ File or ffProbe data is missing. Skipping plugin.');
    return noDoviResponse;
  }

  if (args.inputFileObj.fileMedium !== 'video') {
    args.jobLog('☒ File is not a video. Skipping plugin.');
    return noDoviResponse;
  }

  args.jobLog('☑ File is a video. Starting Dolby Vision detection...');

  // Run ffmpeg to get detailed information including side data
  const cliArgs = [
    '-i', args.inputFileObj._id,
    '-hide_banner',
    '-loglevel', 'info',
  ];

  // Update worker with CLI info
  args.updateWorker({
    CLIType: args.ffmpegPath,
    preset: cliArgs.join(' '),
  });

  // Execute FFmpeg command to get detailed information
  const cli = new CLI({
    cli: args.ffmpegPath,
    spawnArgs: cliArgs,
    spawnOpts: {},
    jobLog: args.jobLog,
    outputFilePath: '', // No output file needed for this operation
    inputFileObj: args.inputFileObj,
    logFullCliOutput: true, // We need to capture all output
    updateWorker: args.updateWorker,
    args,
  });

  const res = await cli.runCli();

  if (res.cliExitCode !== 1) {
    // FFmpeg returns exit code 1 when used for information only, so this is actually an error
    args.jobLog(`Running FFmpeg failed with unexpected exit code ${res.cliExitCode}`);
    return noDoviResponse;
  }

  // Parse the output to find DOVI configuration
  const output = res.errorLogFull.join('\n') || '';

  // Look for DOVI configuration record in the output
  const doviMatch = output.match(/DOVI configuration record: version: \d+\.\d+, profile: (\d+)/);

  if (!doviMatch) {
    args.jobLog('☒ No Dolby Vision configuration record found. File is SDR or HDR10/HDR10+.');
    return noDoviResponse;
  }

  // Extract the profile number
  const profileNumber = parseInt(doviMatch[1], 10);
  args.jobLog(`☑ Dolby Vision detected! Profile: ${profileNumber}`);

  // Set the output based on the profile
  let outputNumber = 5; // Default to SDR

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
      args.jobLog(`☒ Unsupported Dolby Vision profile: ${profileNumber}. Treating as SDR.`);
      return noDoviResponse;
  }

  // Return the result with the appropriate output number
  return {
    outputFileObj: {
      _id: args.inputFileObj._id,
    },
    outputNumber,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
