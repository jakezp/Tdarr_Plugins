import { IpluginDetails } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'AC3 Audio Stream Handler',
  description: `This plugin ensures the file has exactly one English audio stream, encoded in AC3 (5.1 preferred).
  - If an English AC3 5.1 stream exists, it's kept and all others are removed.
  - If not, the best available English audio stream (highest channel count) is converted to AC3 
    (downmixing channels > 6 to 5.1 if necessary), and all others are removed.
  - If no English audio stream exists, audio streams remain untouched.
  - All non-English subtitle streams are removed.
  - Streams are re-ordered: Video, Audio, Subtitle.
  - The container is set to MKV.`,
  style: {
    borderColor: 'blue',
  },
  tags: 'audio,ac3,subtitle,mkv,ffmpeg',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [
    {
      label: 'Keep Only English AC3',
      name: 'keepOnlyEnglishAC3',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'If true, only keep one English AC3 audio stream and remove all others.',
    },
    {
      label: 'Remove Non-English Subtitles',
      name: 'removeNonEnglishSubs',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'If true, remove all non-English subtitle streams.',
    },
    {
      label: 'Convert to MKV',
      name: 'convertToMkv',
      type: 'boolean',
      defaultValue: 'true',
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false',
        ],
      },
      tooltip: 'If true, convert the container to MKV.',
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
