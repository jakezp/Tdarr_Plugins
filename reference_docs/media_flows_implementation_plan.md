# Comprehensive Media Standardization Flow Implementation Plan

This document outlines the detailed implementation plan for a comprehensive Tdarr flow that standardizes media files according to specific requirements.

## Requirements Summary

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

Following the "One Flow to rule them all" structure, we'll create a series of interconnected flows:

1. **Input Flow**: Initial file analysis and tagging
2. **Prep Flow**: Container standardization and stream preparation
3. **Audio Flow**: Audio stream standardization using AC3 Audio Stream Handler
4. **Video Flow**: Video processing based on codec and HDR type
5. **Save Flow**: Final processing and output

## Detailed Flow Design

### 1. Input Flow

The Input Flow performs initial analysis and tagging of the input file:

- Input file validation
- Parse file with Radarr/Sonarr (if applicable)
- Check HDR type (Dolby Vision, HDR10+, HDR10, SDR)
- For Dolby Vision, check profile (4, 5, 8, 7, other)
- Tag file based on resolution (4K, 1440p, 1080p, 720p, etc.)
- Check video codec (H.265, H.264, other)
- Set flow variables for later use

### 2. Prep Flow

The Prep Flow prepares the file for processing:

- Check file extension
- For MKV files, run MKVPropEdit
- Reorder streams (video, audio, subtitle)
- Remove data streams
- Remove image streams
- Clean titles
- Based on HDR type and container, determine next steps

### 3. Audio Flow

The Audio Flow standardizes audio streams:

- Use AC3 Audio Stream Handler to:
  - Keep only one English AC3 audio stream
  - Convert other English audio to AC3 if needed
  - Downmix channels > 6 to 5.1
- Implement retry logic for audio processing failures

### 4. Video Flow

The Video Flow processes video based on codec and HDR type:

#### For Dolby Vision (profiles 4, 5, 8):
1. Extract HEVC stream
2. Extract DoVi RPU
3. Transcode video if needed (maintaining resolution and framerate)
4. Inject DoVi RPU
5. Package DoVi MP4
6. Remux DoVi MP4 with audio

#### For HDR10 and HDR10+:
1. Maintain HDR metadata
2. Convert to H.265 if not already
3. Set container to MP4

#### For SDR content:
1. Keep H.265 or H.264 as is
2. Convert other codecs to H.265
3. Set container to MP4

### 5. Save Flow

The Save Flow handles final processing and output:

- Compare file duration ratio (ensure within 99.5% - 100.5%)
- Compare file size ratio (ensure not exceeding 103% of original)
- Move to blackhole for Radarr/Sonarr pickup
- Wait for rename from Radarr/Sonarr
- Send notification on completion or failure

## Error Handling and Retry Logic

Comprehensive error handling and retry logic:

1. **Retry Levels**:
   - Retry 1: Try with MP4 container
   - Retry 2: Try extracting subtitles
   - Retry 3: Try clean remux
   - Retry 4: Force timescale
   - Retry 5: Force conform on remux

2. **Duration and Size Checks**:
   - Ensure output file duration is within acceptable range
   - Ensure output file size is reasonable

3. **Notifications**:
   - Send notifications for failures
   - Log detailed error information

## Example Scenarios

### Scenario 1: Movie1.mkv
- **Input**: 4K DV4 HDR h.265 video, 7.1 EN TrueHD audio, stereo commentary, 5.1 FR AC3, image stream, 12 subtitle streams
- **Processing**:
  - Identify as Dolby Vision Profile 4
  - Process through DoVi workflow
  - Convert TrueHD 7.1 to AC3 5.1
  - Remove commentary and French audio streams
  - Remove image stream
  - Keep compatible English subtitles
  - Maintain 4K resolution and HDR metadata

### Scenario 2: Movie2.mp4
- **Input**: 1080p SDR h.264 video, AC3 EN 5.1 audio, 3 subtitle streams
- **Processing**:
  - Keep MP4 container
  - Keep h.264 video codec
  - Keep AC3 EN 5.1 audio
  - Keep English subtitle, remove others
  - Minimal processing needed

### Scenario 3: Movie3.mkv
- **Input**: 720p SDR h.264 video, stereo AAC audio, no subtitles
- **Processing**:
  - Change container to MP4
  - Keep h.264 video codec
  - Convert AAC stereo to AC3 stereo
  - Maintain 720p resolution

## Implementation Considerations

1. **Performance Optimization**:
   - Configure hardware acceleration where available
   - Optimize for different hardware configurations

2. **Compatibility**:
   - Ensure compatibility with various media players
   - Test with different devices

3. **Future Extensions**:
   - Plan for future profanity redaction feature
   - Design with modularity for easy extension

## Next Steps

1. Create the five flow JSON files
2. Configure each plugin with appropriate settings
3. Implement error handling and retry logic
4. Test with various file types
5. Document the flows with detailed comments