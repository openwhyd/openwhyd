const userModel = require('../models/user.js');

exports.getSuggestedUsers = () =>
  new Promise((resolve) =>
    // TODO: populate this list dynamically, based on latest posted tracks
    userModel.fetchUserBios(
      [
        { id: '512284f57e91c862b2aaf310' }, // Thomas Besnard
        { id: '53b987c8f1db9430aee884f0' }, // VickyKoka
        { id: '518b5a447e91c862b2adea1a' }, // Israel Lindenbaum
        { id: '5020e4327e91c862b2a7c4d9' }, // Steven TB
        { id: '4fe0f8b57e91c862b2a7c274' }, // Masscut
        { id: '53a8707366491c17b2adcbe3' }, // Tom P.
        { id: '5911f8e098267ba4b34b8424' }, // ROBIT
        { id: '5361647f71eaec19b57037e4' }, // Gérard Duquesnoy
        { id: '544c39c3e04b7b4fca803438' }, // Stefanos
        { id: '5228bc3c7e91c862b2b003af' }, // MrArijog
        { id: '4d94501d1f78ac091dbc9b4d' }, // Adrien Joly
      ],
      resolve
    )
  );
