# Media Standardization Flows for Tdarr

This set of flows standardizes media files according to specific requirements:

1. **Container**: MP4
2. **Video Codec**: H.265 (preferred) or H.264
3. **HDR Handling**:
   - Dolby Vision profiles 4, 5, and 8: Process using custom DoVi plugins to MP4
   - Dolby Vision profile 7: Fail and prompt user for input
   - Other HDR content: Maintain HDR metadata in MP4 container
4. **Resolution**: Maintain original resolution
5. **Bit Depth**: 8-bit
6. **Framerate**: Maintain original framerate
7. **Audio**: Single English AC3 stream (preferably 5.1 channels)
8. **Subtitles**: Keep compatible subtitles embedded in MP4 container

## Flow Structure

The standardization process is divided into five interconnected flows:

1. **Input Flow** (`1-Input.json`): Initial file analysis and tagging
2. **Prep Flow** (`2-Prep.json`): Container standardization and stream preparation
3. **Audio Flow** (`3-Audio.json`): Audio stream standardization using AC3 Audio Stream Handler
4. **Video Flow** (`4-Video.json`): Video processing based on codec and HDR type
5. **Save Flow** (`5-Save.json`): Final processing and output

## Installation

1. Import each flow JSON file into Tdarr:
   - Go to "Flows" in the Tdarr UI
   - Click "Import Flow"
   - Select each JSON file one by one

2. Configure user variables in Tdarr:
   - Go to "Settings" > "User Variables"
   - Add the following variables:

### Global Variables

```json
{
  "notification_url": "YOUR_NOTIFICATION_URL",
  "notification_headers": "YOUR_NOTIFICATION_HEADERS",
  "sendgrid_api_key": "YOUR_SENDGRID_API_KEY",
  "email_address": "YOUR_EMAIL_ADDRESS",
  "email_domain": "YOUR_EMAIL_DOMAIN"
}
```

### Library Variables

```json
{
  "arr": "radarr or sonarr",
  "arr_host": "YOUR_ARR_HOST",
  "arr_api_key": "YOUR_ARR_API_KEY",
  "path_mapping_from": "YOUR_PATH_MAPPING_FROM",
  "path_mapping_to": "YOUR_PATH_MAPPING_TO",
  "output_dir_done": "YOUR_OUTPUT_DIRECTORY",
  "audio_language": "eng",
  "remove_subs": "false"
}
```

## Usage

1. Create a new Tdarr library pointing to your media files
2. Set the library to use the "1 - Media Standardization - Input" flow
3. Start the library processing

## Flow Details

### 1. Input Flow

- Analyzes input file properties
- Tags file based on HDR type, resolution, codec, etc.
- Sets flow variables for later use

### 2. Prep Flow

- Standardizes container
- Removes data streams and images
- Cleans titles
- Reorders streams

### 3. Audio Flow

- Uses AC3 Audio Stream Handler to standardize audio
- Keeps one English AC3 audio stream
- Extracts subtitles if needed

### 4. Video Flow

- Processes video based on HDR type and codec
- For Dolby Vision: Extracts RPU, transcodes if needed, injects RPU, packages to MP4
- For HDR10/HDR10+: Maintains HDR metadata, converts to H.265 if needed
- For SDR: Keeps H.265/H.264 or converts to H.265

### 5. Save Flow

- Validates output file (duration and size)
- Moves file to blackhole for Radarr/Sonarr pickup
- Waits for rename
- Sends notification

## Error Handling

The flows include comprehensive error handling and retry logic:

1. **Retry Levels**:
   - Retry 1: Try with MP4 container
   - Retry 2: Try extracting subtitles
   - Retry 3: Try clean remux
   - Retry 4: Force timescale
   - Retry 5: Force conform on remux

2. **Duration and Size Checks**:
   - Ensure output file duration is within acceptable range (99.5% - 100.5%)
   - Ensure output file size is reasonable (not exceeding 103% of original)

3. **Notifications**:
   - Send notifications for failures
   - Log detailed error information

## Example Scenarios

### Scenario 1: 4K Dolby Vision Movie
- Identifies as Dolby Vision Profile 4
- Processes through DoVi workflow
- Converts TrueHD 7.1 to AC3 5.1
- Keeps compatible English subtitles
- Maintains 4K resolution and HDR metadata

### Scenario 2: 1080p SDR Movie
- Keeps MP4 container
- Keeps h.264 video codec
- Keeps AC3 EN 5.1 audio
- Keeps English subtitle
- Minimal processing needed

### Scenario 3: 720p SDR TV Show
- Changes container to MP4
- Keeps h.264 video codec
- Converts AAC stereo to AC3 stereo
- Maintains 720p resolution

## Customization

You can customize these flows by:

1. Modifying the JSON files directly
2. Adjusting user variables
3. Adding or removing plugins as needed

## Requirements

- Tdarr version 2.00.00 or higher
- FFmpeg with hardware acceleration support (optional but recommended)
- Radarr/Sonarr for automatic organization (optional)