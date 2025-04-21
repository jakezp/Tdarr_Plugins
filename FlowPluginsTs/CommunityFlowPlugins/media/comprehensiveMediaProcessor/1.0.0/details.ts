import { IpluginDetails } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Comprehensive Media Processor',
  description: `This plugin provides comprehensive media processing with minimal stream separation:
  
  - Container conversion from MKV to MP4
  - Extract and keep only specified language subtitles as SRT files
  - Detect and convert Dolby Vision to SDR using libplacebo when needed
  - Standardize audio to a single specified language AC3 stream
  - Downmix audio channels > 6 to 5.1
  
  This plugin is designed to work between ffmpegCommandStart and ffmpegCommandExecute
  while minimizing stream separation to avoid sync issues.`,
  style: {
    borderColor: 'blue',
  },
  tags: 'video,audio,subtitle,container,dolby vision,hdr,ac3,mp4,ffmpeg',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Audio Language',
      name: 'audioLanguage',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Language code for audio to keep (e.g., eng, fre, ger)',
    },
    {
      label: 'Subtitle Language',
      name: 'subtitleLanguage',
      type: 'string',
      defaultValue: 'eng',
      inputUI: {
        type: 'text',
      },
      tooltip: 'Language code for subtitles to keep (e.g., eng, fre, ger)',
    },
    {
      label: 'Extract Subtitles',
      name: 'extractSubtitles',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'Extract subtitles as SRT files alongside the video',
    },
    {
      label: 'Convert Dolby Vision to SDR',
      name: 'convertDoviToSdr',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'Convert Dolby Vision content to SDR using libplacebo',
    },
    {
      label: 'Target Container',
      name: 'targetContainer',
      type: 'string',
      defaultValue: 'mp4',
      inputUI: {
        type: 'dropdown',
        options: [
          'mp4',
          'mkv',
        ],
      },
      tooltip: 'Target container format',
    },
  ],
  outputs: [
    {
      number: 1,
      tooltip: 'Continue to next plugin',
    },
  ],
});

export default details;
