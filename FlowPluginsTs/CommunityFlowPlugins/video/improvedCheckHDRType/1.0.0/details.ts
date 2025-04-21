import { IpluginDetails } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Improved Check HDR Type',
  description: `This plugin provides comprehensive HDR detection for video files.
  It checks for various HDR formats including:
  - Dolby Vision
  - HDR10+
  - HDR10
  - HLG
  
  The plugin uses multiple detection methods to ensure accurate identification:
  1. FFprobe color metadata (transfer characteristics, primaries, etc.)
  2. MediaInfo HDR_Format property
  3. Side data for Dolby Vision
  4. Color space information
  
  This is an improved version of the checkHDRType plugin with more robust detection.`,
  style: {
    borderColor: 'orange',
  },
  tags: 'video,hdr,dolby vision,hdr10,hlg',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: 'faQuestion',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'File is Dolby Vision',
    },
    {
      number: 2,
      tooltip: 'File is HDR10+',
    },
    {
      number: 3,
      tooltip: 'File is HDR10',
    },
    {
      number: 4,
      tooltip: 'File is HLG',
    },
    {
      number: 5,
      tooltip: 'File is SDR',
    },
  ],
});

export default details;
