// Configuration for semantic-release
// Documentation: https://semantic-release.gitbook.io/semantic-release/usage/configuration

module.exports = {
  branch: 'main',
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'angular',
        releaseRules: [
          {
            type: 'docs',
            scope: 'README',
            release: 'patch',
          },
          {
            type: 'refactor',
            release: 'patch',
          },
          {
            type: 'style',
            release: 'patch',
          },
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
        },
      },
    ],
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/git',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
  verifyConditions: ['@semantic-release/github'],
  prepare: [
    {
      path: '@semantic-release/changelog',
      changelogFile: 'CHANGELOG.md',
    },
    '@semantic-release/npm',
    {
      path: '@semantic-release/git',
      assets: ['package.json', 'package-lock.json', 'CHANGELOG.md'],
      message:
        'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    },
  ],
  publish: '@semantic-release/github',
  success: [],
  fail: [],
  npmPublish: false,
};
