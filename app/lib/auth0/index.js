exports.updateUserName = async (userId, name) => {
  // Prerequisite: this API call requires
  // - that Machine-to-machine API is enabled for this app
  // - and that "update:users" permission is granted.
  // See https://manage.auth0.com/dashboard/eu/dev-vh1nl8wh3gmzgnhp/apis/63d3adf22b7622d7aaa45805/authorized-clients
  const { ManagementClient } = require('auth0');
  return await new ManagementClient({
    domain: process.env.AUTH0_ISSUER_BASE_URL.split('//').pop(),
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: 'update:users',
  }).updateUser({ id: `auth0|${userId}` }, { name });
};
