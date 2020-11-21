const userModel = require('../models/user.js');

exports.getSuggestedUsers = () =>
  new Promise((resolve) =>
    // TODO: populate this list dynamically, based on latest posted tracks
    userModel.fetchUserBios(
      [
        { id: '4d94501d1f78ac091dbc9b4d' }, // adrien joly
      ],
      resolve
    )
  );
