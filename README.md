[![Build Status](https://img.shields.io/travis/openwhyd/openwhyd/master.svg?style=flat-square)](https://travis-ci.org/openwhyd/openwhyd) [![OpenCollective](https://opencollective.com/openwhyd/backers/badge.svg?style=flat-square)](#backers) [![Contributors](https://img.shields.io/badge/all_contributors-23-brightgreen.svg?style=flat-square)](#contributors) [![frequently asked questions](https://img.shields.io/badge/help-FAQ-ff69b4.svg?style=flat-square)](docs/FAQ.md) [![Music lover club on Facebook](https://img.shields.io/badge/chat-music%20lover%20club-blue.svg?style=flat-square)](https://facebook.com/groups/openwhyd/) [![Follow Openwhyd on Twitter](https://img.shields.io/twitter/follow/open_whyd.svg?style=flat-square&label=Follow)](https://twitter.com/open_whyd)
# Openwhyd

> Discover, collect and play music from Youtube, Soundcloud, Bandcamp, Deezer and other streaming platforms.

Openwhyd is:
- an independent music curation service freely available at [openwhyd.org](https://openwhyd.org);
- a community of music lovers who enjoy taking their time to find the best tracks and videos for their collection;
- a collaborative / open-source project maintained by passionate volunteers. You too can contribute!

## Openwhyd.org

Music libraries like Spotify and Apple Music make it easy to play and collect music that is released officially by music labels.

**Openwhyd**, on the other hand, allows music lovers to discover, play and collect *any* musical gem that is available on the most popular streaming platforms, including:

- music videos, bootlegs and specific live performances,
- fresh tracks from new and/or local artists,
- DJ sets and rare remixes,
- or any song that can be found and streamed online.

**Free to use at [openwhyd.org](https://openwhyd.org), and [on your iPhone](https://openwhyd.org/iphone).**

### Features

[![Openwhyd Demo Video](./docs/img/openwhyd-demo-thumb.png)](https://www.youtube.com/watch?v=aZT8VlTV1YY "Openwhyd Demo Video")

- Playlists: made of tracks from **various sources**: Youtube, Soundcloud, Bandcamp, Deezer...
- Button: Add a track from **any web page**, in a few clicks, using our Google Chrome extension and bookmarklet
- Radio: **Subscribe** to music curators based on your musical taste, and listen to their latest discoveries
- Fame: Get a following by creating awesome playlists, and being featured in the "**Hot Tracks**" ranking
- Search: Add descriptions to your track, to make them **easier to find** when you need them
- Integration: Embed your playlists on your blog or website, so your visitors can listen to it directly.

👋 A question, a problem? Check out [our FAQ](docs/FAQ.md).

## Development

### Status

Initially known as [whyd.com](https://whyd.com), the development of this product started in 2012, and was lead by [Adrien Joly](https://github.com/adrienjoly). It became open-source in 2016. Read the full story [from Whyd to Openwhyd](https://medium.com/openwhyd/music-amongst-other-topics-a4f41657d6d).

Since 2016, Adrien Joly has been taking care of Openwhyd's domain name, infrastructure and data on his spare time.

- Vision and roadmap: [The Future of Openwhyd](https://medium.com/openwhyd/the-future-of-openwhyd-9a39e0839ac3)
- Tasks that are open to contributions: [GitHub Project](https://github.com/openwhyd/openwhyd/projects/1)
- How to contribute? Check out our [Support Openwhyd](#support-openwhyd) section for more info. Beginners are welcome too! 🤗
<!--
- Latest stats, analytics and demographics: [Openwhyd data report, mid-october 2017](https://infograph.venngage.com/publish/c74df49b-2d2f-48bc-b9cb-5bc1f5908c37) 🔥
-->

### Tech stack

- Node.js
- Express-like Web Server
- jQuery
- HTML + CSS
- [Playemjs](https://github.com/adrienjoly/playemjs) for streaming tracks continuously

### Setup and usage

You just need Docker and `git` installed on your computer:

```sh
$ git clone https://github.com/openwhyd/openwhyd.git
$ cd openwhyd
$ docker-compose up
$ open localhost:8080
```

More info about **Setup and Usage**: [INSTALL.md](docs/INSTALL.md).

If you want to deploy Openwhyd to a server, you can follow our guide: [How to deploy on DigitalOcean](docs/howto-deploy-on-digitalocean.md).

## Support Openwhyd

There are several way you can help Openwhyd! 💓

- If you're a **developer**, you can help us reply to our users' problems and questions from the [Music Lovers Club](https://www.facebook.com/groups/openwhyd/), maintain [issues](https://github.com/openwhyd/openwhyd/issues), or even better: [contribute to the codebase](docs/FAQ.md#id-love-to-contribute-to-openwhyd-how-can-i-help). (beginners are welcome too!)

- You can help Openwhyd sustain by [becoming a backer](https://opencollective.com/openwhyd/order/313) (*starting at $1/month, can be interrupted anytime*), or giving a [one-off donation](https://opencollective.com/openwhyd/donate). We publish our expenses transparently on [Open Collective](https://opencollective.com/openwhyd).

- If you have **other skills** you'd like to contribute to Openwhyd, please [tell us](https://github.com/openwhyd/openwhyd/issues/new?title=Hi,+I+want+to+help!).

- If you're out of time and money, you can still **spread the word** about openwhyd.org, e.g. by showing it to your friends or sharing your playlists on social networks.

Thank you in advance for your kindness! 🤗

### Promotion

We strive to keep Openwhyd up and running for our community of music lovers. In order to attract users and contributors, [Adrien Joly](https://github.com/adrienjoly) regularly promotes the project and helps developers who want to get involved:

- [Le développement durable appliqué au code, de Whyd à Openwhyd](https://www.youtube.com/watch?v=MA5weD7giNU) (Nov 15, 2018, CTO Pizza Live)
- [Openwhyd, a startup product given to its community of users](https://docs.google.com/presentation/d/1bahmSwu9P5vhcTanWEmQ72OXD5_xqcxwQY4MvWnJlXU) (Oct 16, 2018, GitHub Universe Meetup @ Algolia)
- [Présentation d'Openwhyd, app web de curation musicale ouverte aux contributeurs](https://adrienjoly.com/slides/openwhyd-2017) (Oct 25, 2017, Meetup Node.js Paris)

If you you want to contribute, you can get help from Adrien by bringing your laptop to [Hackergarten meetups](https://www.meetup.com/fr-FR/Paris-Hackergarten), happening in Paris every month. Otherwise, check out our recommendations listed in the *Support Openwhyd* section, above.

### Contributors

These are the wonderful people whose time and sweat have made Openwhyd's heart beat since 2012! 💓 ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://d1qb2nb5cznatu.cloudfront.net/users/56004-large?1405472476" width="98px;"/><br /><sub><b>Gilles Poupardin</b></sub>](https://twitter.com/gillespoupardin)<br />[📢](#talk "Talks") [🤔](#ideas "Ideas, Planning, & Feedback") [💵](#financial "Financial") | [<img src="https://avatars0.githubusercontent.com/u/764618?v=4" width="98px;"/><br /><sub><b>Jie Meng-Gérard</b></sub>](https://github.com/jiem)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=jiem "Code") [🚇](#infra-jiem "Infrastructure (Hosting, Build-Tools, etc)") [💵](#financial-jiem "Financial") | [<img src="https://avatars3.githubusercontent.com/u/531781?v=4" width="98px;"/><br /><sub><b>Adrien Joly</b></sub>](https://adrienjoly.com/now)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=adrienjoly "Code") [📖](https://github.com/openwhyd/openwhyd/commits?author=adrienjoly "Documentation") [⚠️](https://github.com/openwhyd/openwhyd/commits?author=adrienjoly "Tests") [💬](#question-adrienjoly "Answering Questions") | [<img src="https://avatars3.githubusercontent.com/u/910269?v=4" width="98px;"/><br /><sub><b>loickm</b></sub>](https://github.com/loickm)<br />[🎨](#design-loickm "Design") [💻](https://github.com/openwhyd/openwhyd/commits?author=loickm "Code") | [<img src="https://pbs.twimg.com/profile_images/708991890046246912/TrUSqpzo_400x400.jpg" width="98px;"/><br /><sub><b>Tony Hymes</b></sub>](https://twitter.com/tonyhymes)<br />[📢](#talk "Talks") [📝](#blog "Blogposts") [📋](#eventOrganizing "Event Organizing") [💬](#question "Answering Questions") | [<img src="https://avatars1.githubusercontent.com/u/603808?v=4" width="98px;"/><br /><sub><b>Damien Romito</b></sub>](http://www.choses.fr)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=damienromito "Code") [🔌](#plugin-damienromito "Plugin/utility libraries") | [<img src="https://www.nikonclub.fr/sites/default/files/styles/dashboard_avatar/public/users/avatars/2018-08/0036_Camille-Betinyani-2_0.jpg?itok=cceSKmUx" width="98px;"/><br /><sub><b>Camille Betinyani</b></sub>](http://www.camillebetinyani.com)<br />[🎨](#design "Design") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://cloudinary-a.akamaihd.net/hopwork/image/upload/h_360,w_360,c_thumb,g_face,z_0.4,q_auto,dpr_2.0/wdxqlikzwk4p8fcj1u6k.jpeg" width="98px;"/><br /><sub><b>Claire Marion</b></sub>](https://github.com/cmdcmdcmd)<br />[🎨](#design-cmdcmdcmd "Design") [📝](#blog-cmdcmdcmd "Blogposts") [🤔](#ideas-cmdcmdcmd "Ideas, Planning, & Feedback") | [<img src="https://avatars1.githubusercontent.com/u/1169844?v=4" width="98px;"/><br /><sub><b>Julien Tanay</b></sub>](http://julientanay.com)<br />[🚇](#infra-Djiit "Infrastructure (Hosting, Build-Tools, etc)") [🔧](#tool-Djiit "Tools") [💻](https://github.com/openwhyd/openwhyd/commits?author=Djiit "Code") | [<img src="https://avatars0.githubusercontent.com/u/243268?v=4" width="98px;"/><br /><sub><b>Adrien Candiotti</b></sub>](https://github.com/SkinyMonkey)<br />[🚇](#infra-SkinyMonkey "Infrastructure (Hosting, Build-Tools, etc)") [💻](https://github.com/openwhyd/openwhyd/commits?author=SkinyMonkey "Code") [🤔](#ideas-SkinyMonkey "Ideas, Planning, & Feedback") | [<img src="http://static8.viadeo-static.com/ukTJaFEht8_7xghQiybGR5b-XS0=/300x300/member/002141lujf3ta0qu%3Fts%3D1383075404000" width="98px;"/><br /><sub><b>Constance Betinyani</b></sub>](https://www.linkedin.com/in/constance-betinyani-30b8b95a/)<br />[📝](#blog "Blogposts") [🔍](#fundingFinding "Funding Finding") | [<img src="https://d1qb2nb5cznatu.cloudfront.net/users/28089-large?1489180378" width="98px;"/><br /><sub><b>Alberto Fantappie</b></sub>](https://angel.co/alberto-fantappie)<br />[🔍](#fundingFinding "Funding Finding") [📋](#eventOrganizing "Event Organizing") | [<img src="http://www.doyoubuzz.com/var/users/_/2016/8/31/13/1245112/avatar/1188719/avatar_cp_630.jpg?t=1545569639" width="98px;"/><br /><sub><b>Mathilde Vercelletto</b></sub>](https://www.linkedin.com/in/mathildevercelletto/)<br />[📖](https://github.com/openwhyd/openwhyd/commits?author= "Documentation") [💵](#financial "Financial") | [<img src="https://pbs.twimg.com/profile_images/465242079145099264/NXppNjIg_400x400.png" width="98px;"/><br /><sub><b>Henri Lieutaud</b></sub>](https://github.com/ElBurritoPodrido)<br />[🤔](#ideas-ElBurritoPodrido "Ideas, Planning, & Feedback") |
| [<img src="https://avatars3.githubusercontent.com/u/8008820?v=4" width="98px;"/><br /><sub><b>François Burra</b></sub>](https://github.com/FrancoisBurra)<br />[🤔](#ideas-FrancoisBurra "Ideas, Planning, & Feedback") | [<img src="https://avatars0.githubusercontent.com/u/3294460?v=4" width="98px;"/><br /><sub><b>Grey Vugrin</b></sub>](http://greyvugrin@github.io)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=greyvugrin "Code") [🐛](https://github.com/openwhyd/openwhyd/issues?q=author%3Agreyvugrin "Bug reports") [🔧](#tool-greyvugrin "Tools") | [<img src="https://avatars3.githubusercontent.com/u/5300654?v=4" width="98px;"/><br /><sub><b>Marin le Maignan</b></sub>](https://github.com/Marinlemaignan)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=Marinlemaignan "Code") [🐛](https://github.com/openwhyd/openwhyd/issues?q=author%3AMarinlemaignan "Bug reports") [🤔](#ideas-Marinlemaignan "Ideas, Planning, & Feedback") | [<img src="https://media.licdn.com/dms/image/C5603AQFMhpwwbDWWzQ/profile-displayphoto-shrink_800_800/0?e=1546473600&v=beta&t=bijrXeAQKSJoCRybxCoyVgkS0GF_h3GucQVLXu5TKik" width="98px;"/><br /><sub><b>Nicolas Leger</b></sub>](https://github.com/nicolasleger)<br />[🚇](#infra-nicolasleger "Infrastructure (Hosting, Build-Tools, etc)") [💻](https://github.com/openwhyd/openwhyd/commits?author=nicolasleger "Code") | [<img src="https://avatars2.githubusercontent.com/u/1911478?v=4" width="98px;"/><br /><sub><b>Serdar Sever</b></sub>](https://znk.github.io)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=znk "Code") [🐛](https://github.com/openwhyd/openwhyd/issues?q=author%3Aznk "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/19236802?v=4" width="98px;"/><br /><sub><b>Stanislas Châble</b></sub>](https://www.linkedin.com/in/stanislas-chable/)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=Selbahc "Code") [🐛](https://github.com/openwhyd/openwhyd/issues?q=author%3ASelbahc "Bug reports") | [<img src="https://avatars2.githubusercontent.com/u/3671070?v=4" width="98px;"/><br /><sub><b>Pia Mancini</b></sub>](http://piamancini.com)<br />[🔍](#fundingFinding-piamancini "Funding Finding") |
| [<img src="https://avatars2.githubusercontent.com/u/265349?v=4" width="98px;"/><br /><sub><b>Maurice Svay</b></sub>](http://svay.com/)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=mauricesvay "Code") [🐛](https://github.com/openwhyd/openwhyd/issues?q=author%3Amauricesvay "Bug reports") [🎨](#design-mauricesvay "Design") | [<img src="http://jenaiccambre.com/static/jenaic_cambre.7ab05dc2.jpg" width="98px;"/><br /><sub><b>Jénaïc Cambré</b></sub>](http://www.kadiks.net)<br />[💬](#question-kadiks "Answering Questions") | [<img src="https://i.imgur.com/wjtYzX4.jpg" width="98px;"/><br /><sub><b>Felix Aknin</b></sub>](https://www.linkedin.com/in/felix-aknin-61b72597/)<br />[💬](#question "Answering Questions") | [<img src="https://media.licdn.com/dms/image/C4D03AQH19-cggJnutA/profile-displayphoto-shrink_800_800/0?e=1546473600&v=beta&t=fHtEddqYGfuvvn7x4gKeSeLaot89o6OYFn5FFF54cIw" width="98px;"/><br /><sub><b>Patrick Rainier Juen</b></sub>](https://github.com/uLan08)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=uLan08 "Code") [🚇](#infra-uLan08 "Infrastructure (Hosting, Build-Tools, etc)") [✅](#tutorial-uLan08 "Tutorials") | [<img src="https://avatars1.githubusercontent.com/u/9751243?v=4" width="98px;"/><br /><sub><b>Brandon Okeke</b></sub>](http://brawrdon.com)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=Brawrdon "Code") | [<img src="https://avatars2.githubusercontent.com/u/43063269?v=4" width="98px;"/><br /><sub><b>namanbiyani</b></sub>](https://github.com/namanbiyani)<br />[💻](https://github.com/openwhyd/openwhyd/commits?author=namanbiyani "Code") |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

Sorry if we forgot anyone... If you would like to appear on that list (or ask for an update), please [let us know](https://github.com/openwhyd/openwhyd/issues/new?title=Please+add+me+as+a+contributor), or propose a PR after running `npm run add-contrib` (as explained [there](https://www.npmjs.com/package/all-contributors-cli)).

### Backers

Support us with a monthly donation and help us keep Openwhyd alive. [[Become a backer](https://opencollective.com/openwhyd#backer)]

<a href="https://opencollective.com/openwhyd/backer/0/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/1/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/2/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/3/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/4/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/5/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/6/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/7/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/8/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/9/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/10/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/11/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/12/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/13/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/14/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/15/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/16/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/17/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/18/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/19/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/20/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/21/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/22/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/23/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/24/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/25/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/26/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/27/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/28/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/backer/29/website" target="_blank"><img src="https://opencollective.com/openwhyd/backer/29/avatar.svg"></a>

### Sponsors
Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/openwhyd#sponsor)]

<a href="https://whyd.com/" target="_blank"><img alt="Whyd is the company that founded this service, donated the source code and still pays for distribution on Apple's App Store" src="docs/img/sponsor-whyd-smaller.png"></a>
<a href="https://www.digitalocean.com/" target="_blank"><img alt="DigitalOcean has kindly offered us one year worth of hosting, to help us maintain our open-source development effort" src="docs/img/sponsor-digitalocean.png"></a>
<a href="https://www.algolia.com/" target="_blank"><img alt="Algolia has been kindly providing our users with blazing-fast track search for years" src="docs/img/sponsor-algolia.png"></a>
<a href="https://opencollective.com/openwhyd/sponsor/0/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/1/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/2/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/3/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/4/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/5/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/6/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/7/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/8/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/9/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/10/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/11/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/12/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/13/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/14/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/15/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/16/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/17/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/18/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/19/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/20/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/21/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/22/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/23/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/24/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/25/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/26/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/27/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/28/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/openwhyd/sponsor/29/website" target="_blank"><img src="https://opencollective.com/openwhyd/sponsor/29/avatar.svg"></a>
