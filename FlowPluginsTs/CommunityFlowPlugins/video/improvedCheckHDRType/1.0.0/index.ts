import {
  IpluginInputArgs,
  IpluginOutputArgs,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import details from './details';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const plugin = (args: IpluginInputArgs): IpluginOutputArgs => {
  const lib = require('../../../../../methods/lib')();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Default to SDR
  let outputNum = 5;
  let hdrType = 'SDR';

  // Log the start of HDR detection
  args.jobLog('☑ Starting HDR format detection...');

  // Check if file has stream data
  if (!Array.isArray(args?.inputFileObj?.ffProbeData?.streams)) {
    args.jobLog('☒ File has no stream data. Cannot determine HDR type.');
    throw new Error('File has no stream data');
  }

  // Method 1: Check for Dolby Vision using side data
  const hasDolbyVisionSideData = args.inputFileObj.ffProbeData.streams.some((stream) => {
    if (stream.codec_type !== 'video') return false;

    // Check for side_data_list with dovi_configuration
    if (stream.side_data_list && Array.isArray(stream.side_data_list)) {
      return stream.side_data_list.some((sideData) => sideData.side_data_type
        && sideData.side_data_type.includes('DOVI configuration record'));
    }
    return false;
  });

  if (hasDolbyVisionSideData) {
    args.jobLog('☑ Detected Dolby Vision via side data configuration record.');
    outputNum = 1;
    hdrType = 'Dolby Vision';
  }

  // Method 2: Check MediaInfo for HDR format information
  if (outputNum === 5 && args.inputFileObj?.mediaInfo?.track) {
    args.inputFileObj.mediaInfo.track.forEach((stream) => {
      if (stream['@type'].toLowerCase() === 'video') {
        // Check for HDR_Format property
        if (Object.prototype.hasOwnProperty.call(stream, 'HDR_Format')) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (/Dolby Vision/.test(stream.HDR_Format)) {
            args.jobLog('☑ Detected Dolby Vision via MediaInfo HDR_Format.');
            outputNum = 1;
            hdrType = 'Dolby Vision';
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          } else if (/HDR10\+/.test(stream.HDR_Format)) {
            args.jobLog('☑ Detected HDR10+ via MediaInfo HDR_Format.');
            outputNum = 2;
            hdrType = 'HDR10+';
          }
        }

        // Check for HDR format in other MediaInfo properties
        if (outputNum === 5) {
          // Check for transfer_characteristics
          if (Object.prototype.hasOwnProperty.call(stream, 'transfer_characteristics')) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const transferChar = String(stream.transfer_characteristics).toLowerCase();
            if (transferChar.includes('pq') || transferChar.includes('smpte st 2084')) {
              args.jobLog('☑ Detected HDR10 via MediaInfo transfer_characteristics.');
              outputNum = 3;
              hdrType = 'HDR10';
            } else if (transferChar.includes('hlg') || transferChar.includes('hybrid log-gamma')) {
              args.jobLog('☑ Detected HLG via MediaInfo transfer_characteristics.');
              outputNum = 4;
              hdrType = 'HLG';
            }
          }
        }
      }
    });
  }

  // Method 3: Check FFprobe stream data for HDR10 and HLG
  if (outputNum === 5) {
    for (let i = 0; i < args.inputFileObj.ffProbeData.streams.length; i += 1) {
      const stream = args.inputFileObj.ffProbeData.streams[i];
      if (stream.codec_type !== 'video') {
        // Skip non-video streams
        // eslint-disable-next-line no-continue
        continue;
      }

      // Check for HDR10 (PQ/SMPTE 2084) or HLG
      const isPQ = stream.color_transfer === 'smpte2084' || stream.color_transfer === 'smpte2086';
      const isHLG = stream.color_transfer === 'arib-std-b67';
      const hasBT2020 = stream.color_primaries === 'bt2020';

      if ((isPQ || isHLG) && hasBT2020) {
        if (isPQ) {
          args.jobLog(`☑ Detected HDR10 via FFprobe color metadata (transfer: ${stream.color_transfer}).`);
          outputNum = 3;
          hdrType = 'HDR10';
        } else if (isHLG) {
          args.jobLog(`☑ Detected HLG via FFprobe color metadata (transfer: ${stream.color_transfer}).`);
          outputNum = 4;
          hdrType = 'HLG';
        }
        break;
      }

      // Additional check for color space
      if (stream.color_space === 'bt2020nc' || stream.color_space === 'bt2020c') {
        args.jobLog(`☑ Detected potential HDR content via color space: ${stream.color_space}`);
        if (outputNum === 5) {
          outputNum = 3; // Default to HDR10 if we detect BT.2020 color space
          hdrType = 'HDR10';
        }
      }

      // Check for HDR metadata
      if (stream.master_display || stream.max_content_light_level || stream.max_frameaverage_light_level) {
        args.jobLog('☑ Detected HDR10 via presence of HDR metadata (master display or light level info).');
        outputNum = 3;
        hdrType = 'HDR10';
        break;
      }
    }
  }

  // Log the final detection result
  if (outputNum === 5) {
    args.jobLog('☑ No HDR format detected. File appears to be SDR.');
  } else {
    args.jobLog(`☑ Final HDR detection result: ${hdrType}`);
  }

  // Return the result without adding custom variables
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: outputNum,
    variables: args.variables,
  };
};

export {
  details,
  plugin,
};
