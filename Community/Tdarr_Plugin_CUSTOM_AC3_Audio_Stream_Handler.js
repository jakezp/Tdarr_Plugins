/* eslint-disable no-plusplus */
/* eslint-disable no-continue */

const details = () => ({
  id: 'Tdarr_Plugin_CUSTOM_AC3_Audio_Stream_Handler',
  Stage: 'Pre-processing',
  Name: 'AC3 Audio Stream Handler (Single English)',
  Type: 'Video',
  Operation: 'Transcode',
  Description: `[Contains built-in filter] This plugin ensures the file has exactly one English audio stream, 
  encoded in AC3 (5.1 preferred).
  - If an English AC3 5.1 stream exists, it's kept and all others are removed.
  - If not, the best available English audio stream (highest channel count) is converted to AC3 
    (downmixing channels > 6 to 5.1 if necessary), and all others are removed.
  - If no English audio stream exists, audio streams remain untouched.
  - All non-English subtitle streams are removed.
  - Streams are re-ordered: Video, Audio, Subtitle.
  - The container is set to MKV.`,
  Version: '1.0',
  Tags: 'pre-processing,ffmpeg,audio only,subtitle only,configurable,mkv',
  Inputs: [], // No user inputs needed for this version
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (file, librarySettings, inputs, otherArguments) => {
  // Initialize response object
  const response = {
    processFile: false,
    preset: '',
    container: '.mkv', // Always ensure MKV container
    handBrakeMode: false,
    FFmpegMode: true, // We'll use FFmpeg for this
    reQueueAfter: true, // Re-queue to allow other plugins to process the modified file
    infoLog: '',
  };

  // Load the library helper (though we might not use it extensively)
  const lib = require('../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  inputs = lib.loadDefaultValues(inputs, details); // Load default inputs if any were defined

  // Basic File Checks
  // --------------------------------------------------------------------------
  if (!file || !file.ffProbeData || !Array.isArray(file.ffProbeData.streams)) {
    response.infoLog += '☒ File or stream data is missing. Skipping plugin.\n';
    response.processFile = false;
    return response;
  }

  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ File is not a video. Skipping plugin.\n';
    response.processFile = false;
    return response;
  }

  response.infoLog += '☑ File is a video. Starting analysis...\n';

  // Stream Analysis and Processing Logic
  // --------------------------------------------------------------------------
  let audioMapCommand = '';
  let audioCodecCommand = '';
  let subtitleMapCommands = [];
  const videoMapCommand = '-map 0:v?'; // Map all video streams first
  const streamsToRemove = []; // Keep track of original indices to remove
  let targetAudioStreamIndex = -1; // Original index of the audio stream we'll keep/convert
  let sourceAudioStreamForConversion = null; // Details of the stream to convert if needed
  let needsProcessing = false; // Flag to track if any changes are needed
  const audioStreams = []; // Store details of all audio streams
  const subtitleStreams = []; // Store details of all subtitle streams { index: i, language: 'eng' }

  // 1. Analyze Streams
  // --------------------------------------------------------------------------
  file.ffProbeData.streams.forEach((stream, index) => {
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

  const audioCount = audioStreams.length;
  const subtitleCount = subtitleStreams.length;
  response.infoLog += `☑ Found ${audioCount} audio stream(s) and ${subtitleCount} subtitle stream(s).\n`;

  // 2. Audio Stream Selection/Processing Logic
  // --------------------------------------------------------------------------
  let preferredAudioStream = null; // The stream we ideally want (Eng AC3 5.1)
  let bestEnglishAudioStream = null; // The best English stream if preferred doesn't exist

  // Find preferred (Eng AC3 5.1) and best alternative English stream
  audioStreams.forEach((stream) => {
    if (stream.language.includes('eng')) {
      if (stream.codec === 'ac3' && stream.channels === 6) {
        if (!preferredAudioStream) { // Take the first Eng AC3 5.1 found
          preferredAudioStream = stream;
          response.infoLog += `☑ Found preferred English AC3 5.1 audio stream at index ${stream.index}.\n`;
        }
      }
      // Track the best English stream overall (highest channels)
      if (!bestEnglishAudioStream || stream.channels > bestEnglishAudioStream.channels) {
        bestEnglishAudioStream = stream;
      }
    }
  });

  if (preferredAudioStream) {
    // Keep the preferred stream, mark others for removal
    targetAudioStreamIndex = preferredAudioStream.index;
    audioMapCommand = `-map 0:${targetAudioStreamIndex}`;
    audioCodecCommand = '-c:a copy'; // Keep original codec
    response.infoLog += `☑ Keeping English AC3 5.1 stream (index ${targetAudioStreamIndex}).\n`;
    // Mark all other audio streams for removal
    audioStreams.forEach((stream) => {
      if (stream.index !== targetAudioStreamIndex) {
        streamsToRemove.push(stream.index);
      }
    });
    if (streamsToRemove.length > 0) {
      needsProcessing = true;
      response.infoLog += `☑ Marking ${streamsToRemove.length} other audio stream(s) for removal.\n`;
    }
  } else if (bestEnglishAudioStream) {
    // Convert the best English stream, mark others for removal
    targetAudioStreamIndex = bestEnglishAudioStream.index;
    sourceAudioStreamForConversion = bestEnglishAudioStream;
    audioMapCommand = `-map 0:${targetAudioStreamIndex}`;
    response.infoLog += '☒ No English AC3 5.1 stream found. Selecting best English stream '
      + `(index ${targetAudioStreamIndex}, ${sourceAudioStreamForConversion.codec}, `
      + `${sourceAudioStreamForConversion.channels}ch) for conversion.\n`;

    // Determine target channels for AC3
    let targetChannels = sourceAudioStreamForConversion.channels;
    if (targetChannels > 6) {
      targetChannels = 6;
      response.infoLog += `☑ Downmixing audio to 5.1 (${targetChannels} channels).\n`;
    } else if (targetChannels === 4 || targetChannels === 5 || targetChannels === 7) {
      // Handle unsupported AC3 channel layouts by downmixing common cases
      if (targetChannels === 4) targetChannels = 2; // Quad -> Stereo
      if (targetChannels === 5) targetChannels = 6; // 5.0 -> 5.1 (might need specific mapping later if problematic)
      if (targetChannels === 7) targetChannels = 6; // 6.1 -> 5.1
      response.infoLog += '☑ Adjusting unsupported channel count '
        + `(${sourceAudioStreamForConversion.channels}) to ${targetChannels} for AC3 conversion.\n`;
    } else {
      response.infoLog += `☑ Keeping original channel count (${targetChannels}) for AC3 conversion.\n`;
    }

    // The output audio stream index will always be 0 since we only map one audio stream
    audioCodecCommand = `-c:a:0 ac3 -ac ${targetChannels}`; // Convert to AC3 with target channels

    needsProcessing = true; // Conversion requires processing

    // Mark all other audio streams for removal
    audioStreams.forEach((stream) => {
      if (stream.index !== targetAudioStreamIndex) {
        streamsToRemove.push(stream.index);
      }
    });
    if (streamsToRemove.length > 0) {
      response.infoLog += `☑ Marking ${streamsToRemove.length} other audio stream(s) for removal.\n`;
    } else if (audioStreams.length > 1) {
      // This case shouldn't happen if bestEnglishAudioStream logic is correct, but good to log
      response.infoLog += '⚠ Warning: Only one audio stream found, but it needs conversion.\n';
    }
  } else {
    // No English audio found, keep all existing audio streams
    response.infoLog += '☒ No English audio stream found. Skipping audio processing.\n';
    // Map all existing audio streams
    audioMapCommand = '-map 0:a?';
    audioCodecCommand = '-c:a copy';
  }

  // 3. Subtitle Stream Analysis and Removal
  // --------------------------------------------------------------------------
  const englishSubtitleIndices = [];
  subtitleStreams.forEach((stream) => {
    if (stream.language.includes('eng')) {
      englishSubtitleIndices.push(stream.index);
      response.infoLog += `☑ Keeping English subtitle stream (index ${stream.index}).\n`;
    } else {
      streamsToRemove.push(stream.index);
      needsProcessing = true;
      response.infoLog += `☒ Removing non-English subtitle stream (index ${stream.index}, lang: ${stream.language}).\n`;
    }
  });

  // Build subtitle map command based on remaining English subs
  if (englishSubtitleIndices.length > 0) {
    subtitleMapCommands = englishSubtitleIndices.map((idx) => `-map 0:${idx}`);
  } else {
    subtitleMapCommands = ['-map -0:s?']; // Explicitly remove all subs if none are English
    if (subtitleStreams.length > 0) {
      response.infoLog += '☑ No English subtitles found to keep.\n';
    }
  }

  // 4. Build Final FFmpeg Command & Set Processing Flag
  // --------------------------------------------------------------------------
  if (needsProcessing) {
    response.processFile = true; // Mark for processing due to audio/subtitle changes

    // Start building the command parts
    const command = [',']; // Start with comma for Tdarr preset format

    // Add mapping commands in the desired order: Video, Target Audio, English Subtitles
    command.push(videoMapCommand);
    if (audioMapCommand) command.push(audioMapCommand);
    // Only add subtitle maps if there are English subs to keep
    if (englishSubtitleIndices.length > 0 && subtitleMapCommands.length > 0
        && subtitleMapCommands[0] !== '-map -0:s?') {
      command.push(...subtitleMapCommands);
    }

    // Add commands to remove unwanted streams
    // Filter streamsToRemove to ensure we don't try to remove the target audio stream if it was initially marked
    const finalStreamsToRemove = streamsToRemove.filter((idx) => idx !== targetAudioStreamIndex);
    if (finalStreamsToRemove.length > 0) {
      command.push(...finalStreamsToRemove.map((idx) => `-map -0:${idx}`));
      response.infoLog += `☑ Final removal map: ${finalStreamsToRemove.map((idx) => `-map -0:${idx}`).join(' ')}\n`;
    }

    // Add codec commands
    command.push('-c:v copy'); // Copy video codec
    if (audioCodecCommand) command.push(audioCodecCommand); // Copy or convert audio codec
    // Only copy subtitles if we are keeping any english ones
    if (englishSubtitleIndices.length > 0) {
      command.push('-c:s copy');
    }

    // Add stability flag
    command.push('-max_muxing_queue_size 9999');

    // Join command parts into the preset string
    response.preset = command.join(' ');

    response.infoLog += `☑ File requires audio/subtitle processing. Final command args: ${response.preset}\n`;
  } else {
    // No audio or subtitle changes needed
    response.processFile = false; // Assume no processing needed initially
    response.infoLog += '☑ File does not require audio/subtitle processing by this plugin.\n';
  }

  // 5. Final MKV Container Check & Update Processing Flag/Preset if Needed
  // --------------------------------------------------------------------------
  if (file.container !== 'mkv') {
    if (!response.processFile) {
      // Only remux is needed
      response.infoLog += '☑ File container is not MKV. Remuxing required.\n';
      response.processFile = true; // Mark for processing
      // Use a simple remux command, mapping all original streams
      response.preset = ', -map 0 -c copy -max_muxing_queue_size 9999';
    } else {
      // Already processing, MKV container is handled by response.container = '.mkv'
      response.infoLog += '☑ File container is not MKV. Will be remuxed to MKV during audio/subtitle processing.\n';
    }
  } else if (!response.processFile) {
    // File is already MKV and no processing needed
    response.infoLog += '☑ File is already MKV and requires no other processing. Skipping.\n';
  } else {
    // File is already MKV but needs processing
    response.infoLog += '☑ File is already MKV. Proceeding with audio/subtitle processing.\n';
  }

  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
