# Media Standardization Flows

This directory contains both the original multi-file flows and optimized versions for Tdarr media standardization.

## Combined Flow (Recommended)

The `Media-Standardization-Combined.json` file contains a single, comprehensive flow that combines all the functionality of the original 5 separate flows. This is the recommended approach as it:

1. **Simplifies management**: Only one file to maintain and update
2. **Eliminates variable passing issues**: No need to pass variables between flows
3. **Provides better visibility**: The entire process can be seen in one view
4. **Reduces complexity**: Fewer points of failure and easier to debug

### Combined Flow Structure

The combined flow follows a logical sequence:

1. **Input and Analysis**: File input, HDR type detection, codec detection
2. **Preparation**: Stream cleaning, subtitle extraction, stream reordering
3. **Audio Processing**: AC3 audio stream handling
4. **Video Processing**: Dolby Vision handling, H.265 detection, encoding
5. **Output**: File moving and completion

## Optimized Multi-File Flows (Alternative)

If you prefer a modular approach, the optimized multi-file flows are also available:

1. **Input Flow** (`1-Input-Optimized.json`): Initial file analysis and tagging
2. **Prep Flow** (`2-Prep-Optimized.json`): Container standardization and stream preparation
3. **Audio Flow** (`3-Audio-Optimized.json`): Audio stream standardization using AC3 Audio Stream Handler
4. **Video Flow** (`4-Video-Optimized.json`): Video processing based on codec and HDR type
5. **Save Flow** (`5-Save-Optimized.json`): Final processing and output

## Key Features

- **Proper HDR Detection**: Correctly identifies Dolby Vision, HDR10+, HDR10, and SDR content
- **Stream Ordering**: Places audio first, video last for Dolby Vision compatibility
- **Subtitle Handling**: Extracts subtitles to SRT files and preserves them
- **AC3 Audio Processing**: Standardizes audio streams to AC3 format
- **Flexible Container Format**: Supports both MP4 and MKV containers

## Required Variables

The flows use the following variables:

### Library Variables

```json
{
  "output_dir_done": "YOUR_OUTPUT_DIRECTORY"
}
```

## Usage

1. Import the combined flow JSON file into Tdarr:
   - Go to "Flows" in the Tdarr UI
   - Click "Import Flow"
   - Select the `Media-Standardization-Combined.json` file

2. Configure the library variables in Tdarr:
   - Go to "Settings" > "User Variables"
   - Add the required variables

3. Create a new Tdarr library pointing to your media files
4. Set the library to use the "Media Standardization - Combined Flow"
5. Start the library processing

## Customization

You can customize the combined flow by:

1. Modifying the JSON file directly
2. Adjusting user variables
3. Adding or removing steps as needed

For example, if you need additional processing steps or different encoding settings, you can modify the flow to suit your specific requirements.