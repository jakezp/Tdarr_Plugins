# Updated Tdarr Plugin Implementation Plan

## Plugin Overview

We'll create a plugin that:
1.  Identifies or creates a single English AC3 audio stream (prioritizing 5.1 channels, converting the best available English stream if necessary).
2.  Removes all other audio streams.
3.  Removes non-English subtitle streams.
4.  Sorts the remaining streams in the specified order (Video, Audio, Subtitle).
5.  Ensures the final container is MKV.

## Updated Plugin Structure

```mermaid
graph TD
    A[Start] --> B{Check if file is video}
    B -->|No| C[Exit plugin]
    B -->|Yes| D{Handle Audio Streams}
    D --> E{Handle Subtitle Streams}
    E --> F[Sort Streams]
    F --> G{Check container}
    G -->|Not MKV| H[Mark for container remux to MKV]
    G -->|MKV| I[Build FFmpeg command]
    H --> I
    I --> J[Return response]
    J --> K[End]

    subgraph Handle Audio Streams
        direction LR
        D1{Check for English AC3 5.1}
        D1 -->|Found| D2[Keep AC3 5.1, Mark others for removal]
        D1 -->|Not Found| D3{Find best English audio stream (highest channels)}
        D3 -->|Found| D4[Mark for AC3 conversion (downmix if > 6ch), Mark others for removal]
        D3 -->|Not Found| D5[No English audio found - Skip audio processing]
    end

    subgraph Handle Subtitle Streams
        direction LR
        E1[Identify non-English subtitles] --> E2[Mark for removal]
    end

    subgraph Sort Streams
        direction LR
        F1[Define order: Video, Audio, Subtitle] --> F2[Generate map commands]
    end
```

## Updated Implementation Details

### 1. Plugin Metadata

-   ID: `Tdarr_Plugin_CUSTOM_AC3_Audio_Stream_Handler`
-   Name: `AC3 Audio Stream Handler (Single English)`
-   Description: Ensures a single English AC3 audio stream (5.1 preferred), removes non-English subtitles, sorts streams, and sets container to MKV.
-   Inputs: None required.

### 2. Audio Stream Handling Logic

-   **Scan Audio Streams:** Iterate through all audio streams.
-   **Identify Candidates:**
    -   Find any English AC3 5.1 streams.
    -   Find all other English streams, noting their channel counts.
-   **Select Target Stream:**
    -   If an English AC3 5.1 stream exists, select it as the target. Mark all other audio streams for removal.
    -   If no English AC3 5.1 exists, find the English stream with the highest channel count. Select this as the source stream. Mark all other audio streams for removal.
    -   If no English streams exist, skip audio processing steps (no target, no removal).
-   **Prepare Conversion (if needed):**
    -   If the selected source stream is *not* AC3 5.1:
        -   Determine target AC3 channel count:
            -   If source channels <= 6, use source channels.
            -   If source channels > 6, use 6 (5.1).
        -   Add FFmpeg parameters to convert this stream to AC3 with the target channel count (`-c:a ac3 -ac <target_channels>`).

### 3. Subtitle Stream Handling

-   Iterate through subtitle streams.
-   Identify streams where the language tag is *not* 'eng' (case-insensitive).
-   Add FFmpeg parameters (`-map -0:s:<index>`) to remove these non-English streams.

### 4. Stream Ordering

-   Generate FFmpeg `-map` parameters to explicitly define the output order:
    -   `-map 0:v?` (Map all video streams first)
    -   `-map 0:a:<target_audio_index>` (Map the single target audio stream next)
    -   `-map 0:s:<eng_subtitle_indices>` (Map the remaining English subtitle streams last)

### 5. Container Handling

-   Set `response.container = '.mkv'` unconditionally. If the original container was already MKV, FFmpeg handles this efficiently during the copy/transcode process.

### 6. FFmpeg Command Construction

-   Start with base command: `<io>`.
-   Add stream mapping commands for ordering (`-map 0:v? -map 0:a:<target_index> ...`).
-   Add stream removal commands (`-map -0:a:<remove_index> -map -0:s:<remove_index> ...`).
-   Add video codec copy: `-c:v copy`.
-   Add audio codec command:
    -   If converting: `-c:a ac3 -ac <channels>` for the target stream.
    -   If keeping existing AC3: `-c:a copy` for the target stream.
-   Add subtitle codec copy: `-c:s copy`.
-   Add `-max_muxing_queue_size 9999` for stability.
-   Combine into `response.preset`.

### 7. Code Structure

The overall Javascript structure remains similar, but the logic within the `plugin` function will implement these updated steps.

## Testing Strategy

The testing strategy remains the same, ensuring coverage for all scenarios, including files with no English audio.

---