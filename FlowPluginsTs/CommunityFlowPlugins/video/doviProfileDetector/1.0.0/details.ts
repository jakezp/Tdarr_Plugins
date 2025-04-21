import { IpluginDetails } from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

const details = (): IpluginDetails => ({
  name: 'Dolby Vision Profile Detector',
  description: `This plugin detects if a video file contains Dolby Vision and identifies the profile.
  It analyzes the file using ffmpeg and looks for DOVI configuration records.
  
  The plugin will output to one of the following:
  - Output 1: DolbyVision - profile 4
  - Output 2: DolbyVision - profile 5
  - Output 3: DolbyVision - profile 7
  - Output 4: DolbyVision - profile 8
  - Output 5: No DolbyVision/SDR
  
  The plugin also sets a flow variable 'dovi_profile' with the detected profile number (4, 5, 7, 8) or 0 for SDR.`,
  style: {
    borderColor: 'purple',
  },
  tags: 'video,dolby vision,dovi,hdr,ffmpeg',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.11.01',
  sidebarPosition: -1,
  icon: '',
  inputs: [],
  outputs: [
    {
      number: 1,
      tooltip: 'DolbyVision - profile 4',
    },
    {
      number: 2,
      tooltip: 'DolbyVision - profile 5',
    },
    {
      number: 3,
      tooltip: 'DolbyVision - profile 7',
    },
    {
      number: 4,
      tooltip: 'DolbyVision - profile 8',
    },
    {
      number: 5,
      tooltip: 'No DolbyVision/SDR',
    },
  ],
});

export default details;
