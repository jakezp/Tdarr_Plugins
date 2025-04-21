/* eslint max-len: 0 */
const run = require('../helpers/run'); // Helper to run the tests

// Define test cases
// The run helper will automatically load the plugin with the same name as this test file
const tests = [
  // Test Case 1: Eng AAC 5.1 audio, Eng/Fre subtitles, MP4 container
  {
    // Input configuration for the plugin function
    input: {
      // Mock file object loaded from our sample data
      file: require('../sampleData/media/sample_scenario_1.json'),
      // Mock library settings (usually not needed for logic tests)
      librarySettings: {},
      // Mock user inputs (our plugin doesn't have any)
      inputs: {},
      // Mock other arguments (usually not needed)
      otherArguments: {},
    },
    // Expected output from the plugin function
    output: {
      processFile: true, // Should process: needs audio conversion, sub removal, remux
      // Expected FFmpeg preset string (order matters!) - Using -map 0:v? is more robust
      preset: ', -map 0:v? -map 0:1 -map 0:2 -map -0:3 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv', // Should output MKV
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      // Now expecting the actual log output
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 1 audio stream(s) and 2 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 1, aac, 6ch) for conversion.\n'
               + '☑ Keeping original channel count (6) for AC3 conversion.\n'
               + '☑ Keeping English subtitle stream (index 2).\n'
               + '☒ Removing non-English subtitle stream (index 3, lang: fre).\n'
               + '☑ Final removal map: -map -0:3\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:1 -map 0:2 -map -0:3 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File container is not MKV. Will be remuxed to MKV during audio/subtitle processing.\n',
    },
  },

  // Test Case 2: Base + EN DTS 7.1 + FR AC3 5.1 + EN AAC 2.0
  {
    input: {
      file: require('../sampleData/media/sample_scenario_2.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v? -map 0:2 -map 0:5 -map 0:6 -map -0:1 -map -0:3 -map -0:4 -map -0:7 -map -0:8 -map -0:9 -map -0:10 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 4 audio stream(s) and 6 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 2, dts, 8ch) for conversion.\n'
               + '☑ Downmixing audio to 5.1 (6 channels).\n'
               + '☑ Marking 3 other audio stream(s) for removal.\n'
               + '☑ Keeping English subtitle stream (index 5).\n'
               + '☑ Keeping English subtitle stream (index 6).\n'
               + '☒ Removing non-English subtitle stream (index 7, lang: spa).\n'
               + '☒ Removing non-English subtitle stream (index 8, lang: fre).\n'
               + '☒ Removing non-English subtitle stream (index 9, lang: kor).\n'
               + '☒ Removing non-English subtitle stream (index 10, lang: dut).\n'
               + '☑ Final removal map: -map -0:1 -map -0:3 -map -0:4 -map -0:7 -map -0:8 -map -0:9 -map -0:10\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:2 -map 0:5 -map 0:6 -map -0:1 -map -0:3 -map -0:4 -map -0:7 -map -0:8 -map -0:9 -map -0:10 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File is already MKV. Proceeding with audio/subtitle processing.\n',
    },
  },

  // Test Case 3: Only EN AAC 2.0 audio
  {
    input: {
      file: require('../sampleData/media/sample_scenario_3.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v? -map 0:1 -map 0:2 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 2 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 1 audio stream(s) and 4 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 1, aac, 2ch) for conversion.\n'
               + '☑ Keeping original channel count (2) for AC3 conversion.\n'
               + '☑ Keeping English subtitle stream (index 2).\n'
               + '☑ Keeping English subtitle stream (index 3).\n'
               + '☒ Removing non-English subtitle stream (index 4, lang: spa).\n'
               + '☒ Removing non-English subtitle stream (index 5, lang: fre).\n'
               + '☑ Final removal map: -map -0:4 -map -0:5\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:1 -map 0:2 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 2 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File is already MKV. Proceeding with audio/subtitle processing.\n',
    },
  },

  // Test Case 4: Only EN DTS 7.1 audio
  {
    input: {
      file: require('../sampleData/media/sample_scenario_4.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v? -map 0:1 -map 0:2 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 1 audio stream(s) and 4 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 1, dts, 8ch) for conversion.\n'
               + '☑ Downmixing audio to 5.1 (6 channels).\n'
               + '☑ Keeping English subtitle stream (index 2).\n'
               + '☑ Keeping English subtitle stream (index 3).\n'
               + '☒ Removing non-English subtitle stream (index 4, lang: spa).\n'
               + '☒ Removing non-English subtitle stream (index 5, lang: fre).\n'
               + '☑ Final removal map: -map -0:4 -map -0:5\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:1 -map 0:2 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File is already MKV. Proceeding with audio/subtitle processing.\n',
    },
  },

  // Test Case 5: EN EAC3 5.1 and DTS 7.1 audio streams
  {
    input: {
      file: require('../sampleData/media/sample_scenario_5.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v? -map 0:2 -map 0:3 -map 0:4 -map -0:1 -map -0:5 -map -0:6 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 2 audio stream(s) and 4 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 2, dts, 8ch) for conversion.\n'
               + '☑ Downmixing audio to 5.1 (6 channels).\n'
               + '☑ Marking 1 other audio stream(s) for removal.\n'
               + '☑ Keeping English subtitle stream (index 3).\n'
               + '☑ Keeping English subtitle stream (index 4).\n'
               + '☒ Removing non-English subtitle stream (index 5, lang: spa).\n'
               + '☒ Removing non-English subtitle stream (index 6, lang: fre).\n'
               + '☑ Final removal map: -map -0:1 -map -0:5 -map -0:6\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:2 -map 0:3 -map 0:4 -map -0:1 -map -0:5 -map -0:6 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File is already MKV. Proceeding with audio/subtitle processing.\n',
    },
  },

  // Test Case 6: Swapped subtitle and audio streams
  {
    input: {
      file: require('../sampleData/media/sample_scenario_6.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: ', -map 0:v? -map 0:2 -map 0:1 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999',
      container: '.mkv',
      handBrakeMode: false,
      FFmpegMode: true,
      reQueueAfter: true,
      infoLog: '☑ File is a video. Starting analysis...\n'
               + '☑ Found 1 audio stream(s) and 4 subtitle stream(s).\n'
               + '☒ No English AC3 5.1 stream found. Selecting best English stream (index 2, eac3, 6ch) for conversion.\n'
               + '☑ Keeping original channel count (6) for AC3 conversion.\n'
               + '☑ Keeping English subtitle stream (index 1).\n'
               + '☑ Keeping English subtitle stream (index 3).\n'
               + '☒ Removing non-English subtitle stream (index 4, lang: spa).\n'
               + '☒ Removing non-English subtitle stream (index 5, lang: fre).\n'
               + '☑ Final removal map: -map -0:4 -map -0:5\n'
               + '☑ File requires audio/subtitle processing. Final command args: , -map 0:v? -map 0:2 -map 0:1 -map 0:3 -map -0:4 -map -0:5 -c:v copy -c:a:0 ac3 -ac 6 -c:s copy -max_muxing_queue_size 9999\n'
               + '☑ File is already MKV. Proceeding with audio/subtitle processing.\n',
    },
  },
];

// Run the tests
// The helper script implicitly loads the corresponding plugin file
void run(tests);
