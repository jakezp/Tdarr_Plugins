# Plan for Porting Classic Tdarr Plugin to Flow Plugin

This document outlines the steps to convert a Classic Tdarr Plugin to a Flow Plugin, specifically focusing on porting the `Tdarr_Plugin_CUSTOM_AC3_Audio_Stream_Handler.js` plugin.

## Understanding Flow Plugins

Flow Plugins are modular components designed to be chained together in Tdarr's flow system. Unlike Classic Plugins which handle all logic within a single function, Flow Plugins perform specific tasks or checks and pass the result to the next plugin in the flow.

There are two main types of Flow Plugins:

*   **JavaScript (`FlowPlugins`):** Written directly in JavaScript (`.js` files).
*   **TypeScript (`FlowPluginsTs`):** Written in TypeScript (`.ts` files) and transpiled to JavaScript. TypeScript offers static typing for improved code maintainability and error detection during development.

Individual Flow Plugins (whether JS or TS) do not work together to form a single plugin; each file represents a distinct step in a flow.

## Porting Plan

We will port the `Tdarr_Plugin_CUSTOM_AC3_Audio_Stream_Handler.js` Classic Plugin to a TypeScript Flow Plugin (`FlowPluginsTs`).

**1. Choose Language:**

*   Port to TypeScript (`FlowPluginsTs`) to leverage type safety and align with existing examples.

**2. Create New Plugin Directory Structure:**

*   Create a new versioned directory for the plugin within `tdarr_plugins/FlowPluginsTs/CommunityFlowPlugins/audio/`. A suggested path is `tdarr_plugins/FlowPluginsTs/CommunityFlowPlugins/audio/ac3AudioStreamHandler/1.0.0/`.

**3. Define `details.ts`:**

*   Create a file named `details.ts` in the new plugin directory.
*   Define and export a `details` function that returns an `IpluginDetails` object.
*   Include essential metadata:
    *   `name`: A descriptive name for the Flow Plugin (e.g., "AC3 Audio Stream Handler").
    *   `description`: Explain what the plugin does within a flow.
    *   `version`: The version of the Flow Plugin (e.g., '1.0.0').
    *   `isStartPlugin`: Set to `false` as this plugin will likely follow a filter or other initial plugin.
    *   `pType`: Set to 'Video' or 'Audio' depending on the primary stream type it operates on.
    *   `inputs`: Define an array of input objects. For a direct port, this can be an empty array `[]`. Consider adding inputs later to make aspects like target codec or channels configurable.
    *   `outputs`: Define an array of output objects. Include at least one output with `number: 1` to signify successful processing and continuation in the flow. Additional outputs can be added for different outcomes (e.g., skipped, error).

**4. Define `index.ts`:**

*   Create a file named `index.ts` in the new plugin directory.
*   Import necessary types (`IpluginInputArgs`, `IpluginOutputArgs`) and helper functions (`CLI`, `getContainer`, `getFileName`, `getPluginWorkDir`) from the `../../../../FlowHelpers/1.0.0/` directory.
*   Implement and export an `async plugin(args: IpluginInputArgs): Promise<IpluginOutputArgs>` function.
*   **Adapt Logic:** Translate the stream analysis, selection, and processing logic from the Classic Plugin's `plugin` function into this asynchronous function.
    *   Access file information (streams, container, etc.) via `args.inputFileObj.ffProbeData`.
    *   Use `args.jobLog()` for logging messages during flow execution.
    *   Construct the appropriate FFmpeg command string based on the analysis (selecting the best English audio, determining channel layout, handling subtitles).
    *   Determine the output file path using `getPluginWorkDir(args)` and `getFileName(args.inputFileObj._id)`, ensuring the `.mkv` extension is used: ``${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.mkv``.
    *   Instantiate the `CLI` helper with the FFmpeg path (`args.ffmpegPath`), the constructed arguments array, and other required parameters.
    *   Execute the FFmpeg command using `await cli.runCli()`.
    *   Handle the result of `cli.runCli()`. If `res.cliExitCode !== 0`, log an error and potentially throw an exception to halt the flow for this file.
    *   If the CLI command is successful, return an `IpluginOutputArgs` object. This object must include `outputFileObj: { _id: outputFilePath }` to tell Tdarr the location of the processed file, and `outputNumber: 1` (or the number corresponding to the desired output path in the `details` function).

**5. Implement Helper Usage:**

*   Ensure all necessary helper functions from `FlowHelpers` are correctly imported and used for tasks like getting the plugin work directory, extracting file names, and executing CLI commands.

**6. Testing:**

*   Automated testing for Flow Plugins requires a different setup than Classic Plugins.
*   The primary testing method will be adding the newly created Flow Plugin to a Tdarr flow within the Tdarr UI and processing files with different characteristics to verify its behavior.

This plan provides a structured approach to porting the plugin, breaking down the process into manageable steps and highlighting the key differences and considerations when working with Tdarr's Flow system.