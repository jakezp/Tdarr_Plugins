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
  const keepOnlyEnglishAC3 = String(args.inputs.keepOnlyEnglishAC3) === 'true';
  const removeNonEnglishSubs = String(args.inputs.removeNonEnglishSubs) === 'true';
  const convertToMkv = String(args.inputs.convertToMkv) === 'true';

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

  args.jobLog('☑ File is a video. Starting analysis...');

  // Stream Analysis
  let needsProcessing = false;
  const { streams } = args.inputFileObj.ffProbeData;

  // Categorize streams
  const audioStreams: {
    index: number;
    codec: string;
    language: string;
    channels: number;
  }[] = [];

  const subtitleStreams: {
    index: number;
    language: string;
  }[] = [];

  streams.forEach((stream, index) => {
    if (stream.codec_type === 'audio') {
      const language = (stream.tags && stream.tags.language) ? String(stream.tags.language).toLowerCase() : 'und';
      audioStreams.push({
        index,
        codec: String(stream.codec_name).toLowerCase(),
        language,
        channels: stream.channels || 0,
      });
    } else if (stream.codec_type === 'subtitle') {
      const language = (stream.tags && stream.tags.language) ? String(stream.tags.language).toLowerCase() : 'und';
      subtitleStreams.push({
        index,
        language,
      });
    }
  });

  args.jobLog(`☑ Found ${audioStreams.length} audio stream(s) and ${subtitleStreams.length} subtitle stream(s).`);

  // Define audio stream type
  type AudioStreamType = {
    index: number;
    codec: string;
    language: string;
    channels: number;
  };

  // Audio Stream Selection/Processing Logic
  let preferredAudioStream: AudioStreamType | null = null;
  let bestEnglishAudioStream: AudioStreamType | null = null;
  let targetAudioStreamIndex = -1;
  let sourceAudioStreamForConversion: AudioStreamType | null = null;
  const streamsToRemove: number[] = [];

  // Find preferred (Eng AC3 5.1) and best alternative English stream
  if (keepOnlyEnglishAC3) {
    audioStreams.forEach((stream) => {
      if (stream.language.includes('eng')) {
        if (stream.codec === 'ac3' && stream.channels === 6) {
          if (!preferredAudioStream) { // Take the first Eng AC3 5.1 found
            preferredAudioStream = stream;
            args.jobLog(`☑ Found preferred English AC3 5.1 audio stream at index ${stream.index}.`);
          }
        }
        // Track the best English stream overall (highest channels)
        if (!bestEnglishAudioStream || stream.channels > bestEnglishAudioStream.channels) {
          bestEnglishAudioStream = stream;
        }
      }
    });
  }

  // Audio mapping and codec commands
  let audioMapCommand = '';
  let audioCodecCommand = '';

  if (keepOnlyEnglishAC3) {
    if (preferredAudioStream !== null) {
      // Keep the preferred stream, mark others for removal
      targetAudioStreamIndex = (preferredAudioStream as AudioStreamType).index;
      audioMapCommand = `-map 0:${targetAudioStreamIndex}`;
      audioCodecCommand = '-c:a copy'; // Keep original codec
      args.jobLog(`☑ Keeping English AC3 5.1 stream (index ${targetAudioStreamIndex}).`);

      // Mark all other audio streams for removal
      audioStreams.forEach((stream) => {
        if (stream.index !== targetAudioStreamIndex) {
          streamsToRemove.push(stream.index);
        }
      });

      if (streamsToRemove.length > 0) {
        needsProcessing = true;
        args.jobLog(`☑ Marking ${streamsToRemove.length} other audio stream(s) for removal.`);
      }
    } else if (bestEnglishAudioStream !== null) {
      // Convert the best English stream, mark others for removal
      targetAudioStreamIndex = (bestEnglishAudioStream as AudioStreamType).index;
      sourceAudioStreamForConversion = bestEnglishAudioStream;
      audioMapCommand = `-map 0:${targetAudioStreamIndex}`;

      // Ensure sourceAudioStreamForConversion is not null before accessing its properties
      if (sourceAudioStreamForConversion !== null) {
        const typedSource = sourceAudioStreamForConversion as AudioStreamType;
        args.jobLog('☒ No English AC3 5.1 stream found. Selecting best English stream '
          + `(index ${targetAudioStreamIndex}, ${typedSource.codec}, ${typedSource.channels}ch) for conversion.`);

        // Determine target channels for AC3
        let targetChannels = typedSource.channels;
        if (targetChannels > 6) {
          targetChannels = 6;
          args.jobLog(`☑ Downmixing audio to 5.1 (${targetChannels} channels).`);
        } else if (targetChannels === 4 || targetChannels === 5 || targetChannels === 7) {
          // Handle unsupported AC3 channel layouts by downmixing common cases
          if (targetChannels === 4) targetChannels = 2; // Quad -> Stereo
          if (targetChannels === 5) targetChannels = 6; // 5.0 -> 5.1 (might need specific mapping later if problematic)
          if (targetChannels === 7) targetChannels = 6; // 6.1 -> 5.1
          args.jobLog('☑ Adjusting unsupported channel count '
            + `(${typedSource.channels}) to ${targetChannels} for AC3 conversion.`);
        } else {
          args.jobLog(`☑ Keeping original channel count (${targetChannels}) for AC3 conversion.`);
        }

        // The output audio stream index will always be 0 since we only map one audio stream
        audioCodecCommand = `-c:a:0 ac3 -ac ${targetChannels}`; // Convert to AC3 with target channels
      } else {
        // Default to 2 channels if sourceAudioStreamForConversion is null (shouldn't happen)
        audioCodecCommand = '-c:a:0 ac3 -ac 2';
      }
      needsProcessing = true; // Conversion requires processing

      // Mark all other audio streams for removal
      audioStreams.forEach((stream) => {
        if (stream.index !== targetAudioStreamIndex) {
          streamsToRemove.push(stream.index);
        }
      });

      if (streamsToRemove.length > 0) {
        args.jobLog(`☑ Marking ${streamsToRemove.length} other audio stream(s) for removal.`);
      } else if (audioStreams.length > 1) {
        // This case shouldn't happen if bestEnglishAudioStream logic is correct, but good to log
        args.jobLog('⚠ Warning: Only one audio stream found, but it needs conversion.');
      }
    } else {
      // No English audio found, keep all existing audio streams
      args.jobLog('☒ No English audio stream found. Skipping audio processing.');
      // Map all existing audio streams
      audioMapCommand = '-map 0:a?';
      audioCodecCommand = '-c:a copy';
    }
  } else {
    // Not keeping only English AC3, so copy all audio streams
    audioMapCommand = '-map 0:a?';
    audioCodecCommand = '-c:a copy';
    args.jobLog('☑ Keeping all audio streams as requested.');
  }

  // Subtitle Stream Analysis and Removal
  const englishSubtitleIndices: number[] = [];
  let subtitleMapCommands: string[] = [];

  if (removeNonEnglishSubs) {
    subtitleStreams.forEach((stream) => {
      if (stream.language.includes('eng')) {
        englishSubtitleIndices.push(stream.index);
        args.jobLog(`☑ Keeping English subtitle stream (index ${stream.index}).`);
      } else {
        streamsToRemove.push(stream.index);
        needsProcessing = true;
        args.jobLog(`☒ Removing non-English subtitle stream (index ${stream.index}, lang: ${stream.language}).`);
      }
    });

    // Build subtitle map command based on remaining English subs
    if (englishSubtitleIndices.length > 0) {
      subtitleMapCommands = englishSubtitleIndices.map((idx) => `-map 0:${idx}`);
    } else {
      subtitleMapCommands = ['-map -0:s?']; // Explicitly remove all subs if none are English
      if (subtitleStreams.length > 0) {
        args.jobLog('☑ No English subtitles found to keep.');
      }
    }
  } else {
    // Keep all subtitle streams
    subtitleMapCommands = ['-map 0:s?'];
    args.jobLog('☑ Keeping all subtitle streams as requested.');
  }

  // Check if container conversion is needed
  const needsContainerConversion = convertToMkv && args.inputFileObj.container !== 'mkv';
  if (needsContainerConversion) {
    needsProcessing = true;
  }

  // If no processing is needed, return early
  if (!needsProcessing && !needsContainerConversion) {
    args.jobLog('☑ File does not require processing by this plugin.');
    return noProcessingResponse;
  }

  // Build FFmpeg command
  const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.mkv`;
  const videoMapCommand = '-map 0:v?'; // Map all video streams

  // Start building the command parts
  const cliArgs: string[] = [];

  // Input file
  cliArgs.push('-i', args.inputFileObj._id);

  // Mapping commands in the desired order: Video, Target Audio, English Subtitles
  cliArgs.push(...videoMapCommand.split(' '));

  if (audioMapCommand) {
    cliArgs.push(...audioMapCommand.split(' '));
  }

  // Only add subtitle maps if there are English subs to keep
  if (englishSubtitleIndices.length > 0 && subtitleMapCommands.length > 0
      && subtitleMapCommands[0] !== '-map -0:s?') {
    subtitleMapCommands.forEach((cmd) => {
      cliArgs.push(...cmd.split(' '));
    });
  } else if (subtitleMapCommands[0] === '-map -0:s?') {
    cliArgs.push(...subtitleMapCommands[0].split(' '));
  } else if (!removeNonEnglishSubs) {
    cliArgs.push(...subtitleMapCommands[0].split(' '));
  }

  // Add commands to remove unwanted streams
  // Filter streamsToRemove to ensure we don't try to remove the target audio stream if it was initially marked
  const finalStreamsToRemove = streamsToRemove.filter((idx) => idx !== targetAudioStreamIndex);
  if (finalStreamsToRemove.length > 0) {
    finalStreamsToRemove.forEach((idx) => {
      cliArgs.push('-map', `-0:${idx}`);
    });
    args.jobLog(`☑ Final removal map: ${finalStreamsToRemove.map((idx) => `-map -0:${idx}`).join(' ')}`);
  }

  // Add codec commands
  cliArgs.push('-c:v', 'copy'); // Copy video codec

  if (audioCodecCommand) {
    cliArgs.push(...audioCodecCommand.split(' ')); // Copy or convert audio codec
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
  args.jobLog(`☑ File requires processing. Final command args: ${cliArgs.join(' ')}`);

  if (needsContainerConversion) {
    args.jobLog('☑ File container is not MKV. Will be remuxed to MKV during processing.');
  } else {
    args.jobLog('☑ File is already MKV. Proceeding with audio/subtitle processing.');
  }

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
