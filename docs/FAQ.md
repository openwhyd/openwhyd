# Frequently Asked Questions / Foire Aux Questions

## General / non-technical questions

### What is Whyd / Openwhyd, what does this name mean?

Openwhyd is a platform that our community of music lovers use to discover, play and share music. Its also a good project for developers to gain experience collaborating on a real-world open-source product and improve their programming skills.

If want to know more, read:

- [What is Openwhyd, and what it‘s not](https://medium.com/openwhyd/what-is-openwhyd-and-what-it-s-not-132f956ccb6),
- [From Whyd to Openwhyd, our story](https://medium.com/openwhyd/music-amongst-other-topics-a4f41657d6d).

### 🇬🇧 How to add music tracks?

Openwhyd offers several ways to add a music track:

1. click on the "Add" link of a track added by someone else, e.g. from [the stream](https://openwhyd.org/stream) (followed users), or from the [hot tracks ranking](https://openwhyd.org/hot);
2. type the title of the track or paste its YouTube URL in Openwhyd's search bar;
3. or use the [Openwhyd➕ button](https://openwhyd.org/button) from a web page that contains a track (after installing our extension for Google Chrome, or bookmarklet).

Demo: https://www.youtube.com/watch?v=aZT8VlTV1YY

### 🇫🇷 Comment ajouter de la musique ?

Pour ajouter un morceau de musique (appelé _track_), Openwhyd propose plusieurs moyens:

1. cliquer sur le lien "Add" d'un morceau ajouté par quelqu'un d'autre, ex: depuis [le stream](https://openwhyd.org/stream) (utilisateurs suivis), ou depuis les [hot tracks](https://openwhyd.org/hot);
2. taper le nom du morceau ou coller l'URL YouTube de ce morceau depuis la barre de recherche d'Openwhyd;
3. ou utiliser le [bouton Openwhyd](https://openwhyd.org/button) depuis une page web contenant un morceau (après avoir installé l'extension pour Google Chrome ou le bookmarklet).

Démo: https://www.youtube.com/watch?v=aZT8VlTV1YY

### How to use Openwhyd on my mobile phone?

So far, Openwhyd can be used from the following devices only:

- use the [web version](https://openwhyd.org) on your computer.
- if you have another kind of smartphone or tablet, you can only use our experimental [Mobile Track Finder](https://openwhyd.org/mobile/) in order to search and play individual tracks from your Openwhyd profile.

Many users are hoping for an Android app. We'd love to make it, but it would take us a whole lot of time. So far, nobody from our community of users volunteered for this, unfortunately.

There is hope, though: one of Openwhyd’s contributors has rebuilt a good chunk of openwhyd.org using the React technology: https://sound-nuggets.xyz 💪

This is great news, because the use of React will make it easier to build a React Native app, and therefore to build an Android app!

If you want to help, please write a comment on this post: https://www.facebook.com/groups/openwhyd/permalink/1999454520336097/ (note: you will need to join our Facebook group first)

### Does Tony, the “Chief BBQ Officer” really exist?

When Openwhyd was still a startup product (called Whyd), Tony was in charge of communicating with our users, and he loved organising barbecues and parties so that we could regularly meet them. So, even though the role sounds funny, it was not completely a joke at the time!

Since the Whyd company shifted its focus to building smart speakers, Tony has moved on to another full time opportunity. And he agreed to let Openwhyd send welcome emails on his behalf.

As you guessed, these welcome emails are send automatically by Openwhyd whenever a new user signs up, and Tony does not longer receives replies to them. That being said, your replies are redirected to our official contact email address, so I receive them and do my best to reply to everybody! ✍️

### What happens when one of the tracks I added is removed from Youtube?

Shit happens. Tracks get removed sometimes, especially on Youtube.

If you keep your playlists on youtube.com, be warned that any track that is removed will also be deleted from the playlists you had added it to, without warning. 😱

At Openwhyd, we know that many music lovers (myself included) are obsessed about being in control of the information that is kept in their collection of music. So we do things differently: when a Youtube track is removed, it is not deleted from your Openwhyd playlists. Even though the track will not play anymore, its title, description and comments added on openwhyd.org will stay. 🗃

This situation is not perfect, but it’s important for us that the list of tracks that we patiently collected on Openwhyd will never be altered.

If it’s important for you to be able to play a removed track, feel free to delete that removed track from your Openwhyd playlist, and re-add it from another source. It’s up to you.

### Is there a way to stream just the audio signal (e.g. from Soundcloud) of a given video track?

Maybe, but we’re not going to do it.

Firstly, Youtube does not allow to stream a track’s audio without displaying the video.

Secondly, I’ve spent weeks trying to find matches of tracks automatically from one streaming platform to another. My conclusion was that it would work just 50% of the time, or many matches would be incorrect. Especially because many Openwhyd users collect tracks that are rare, in very specific versions and/or available through just one platform.

If you really want to have a more bandwidth-efficient way to listen to music, I invite you to try a “legal streaming” music platform like Spotify instead. Because Openwhyd was not designed for that.

### 🇫🇷 Pourquoi faut-il installer Openwhyd pour écouter la musique en arrière plan ?

En Novembre 2017, j'ai décidé de désactiver la lecture en arrière plan car je recevais de plus en plus de messages d'utilisateurs qui se plaignaient que le service ne fonctionnait pas, était buggé, car certains morceaux ne se jouaient pas. Je me suis rendu compte que c'était du au fait que les navigateurs modernes empêchaient les sites comme Openwhyd de démarrer la lecture de vidéos tant qu'ils étaient en arrière plan. Cette décision de la part de Chrome et autres navigateurs qui ont suivi a causé la perte de milliers d'utilisateurs sur Openwhyd. Vu le temps que j'avais investi sur le développement et maintenance d'Openwhyd, j'ai fini par avoir du mal à supporter ces critiques remettant en question la qualité de son fonctionnement.

Sachant que j'avais peu de temps à accorder à résoudre ce problème, la solution la plus rapide que j'ai trouvée était de proposer une version installable d'Openwhyd ne souffrant pas de ces limitations imposées par les navigateurs web. Afin de mettre fin aux critiques tout en garantissant un bon fonctionnement du service pour ses utilisateurs les plus fidèles, j'ai alors décidé de limiter la lecture en arrière plan sur la seule version qui supportait pleinement cette fonctionnalité: la version installable.

J'ai conscience qu'il est impossible pour certains d'utilisateurs d'installer des logiciels sur leur ordinateur, et j'en suis navré. J'ai trois solutions à proposer:

1. trouver un développeur qui accepterait de régler le [problème de lecture en arrière plan](https://github.com/openwhyd/openwhyd/issues/132) sur Openwhyd,
2. utiliser [sound-nuggets](https://sound-nuggets.xyz) pour écouter la musique de ton compte Openwhyd (c'est encore en cours de développement, mais la lecture en arrière plan fonctionne),
3. utiliser un service commercial comme Deezer ou Spotify.

### 🇬🇧 Why should I download Openwhyd to play music in the background?

In November 2017, I decided to disable background playback of tracks on Openwhyd.org, because a growing number of users were complaining that Openwhyd was not working properly, that some Youtube tracks were skipped. I realised that this problem was caused by Chrome and other web browsers preventing media playback from starting while the page was in the background. This problem had caused thousands of users to stop using Openwhyd already. At that point, I had been investing a lot of time maintaining Openwhyd on my spare time, so receiving complaints because of that issue was quite upsetting for me.

Having not much time to invest on solving this problem, the quickest solution I found was to offer a downloadable version of Openwhyd that would not be affected by limitations of mainstream web browsers. In order to be able to maintain a good quality of service for our most loyal users, I decided to disable background playback of tracks from openwhyd.org, and invite users to install the downloadable version instead.

I know that it's impossible for some users to install software on their computer, sorry about that. I can offer 3 solutions:

1. find a developer willing to solve the [background playback issue](https://github.com/openwhyd/openwhyd/issues/132) on Openwhyd,
2. use [sound-nuggets](https://sound-nuggets.xyz) to listen to tracks from your Openwhyd account (it's still work in progress, but background playback does work already some some streaming sources including Youtube),
3. use a commercial service like Deezer or Spotify.

### Is it possible to follow playlists rather than users?

I agree that some of the music lovers you follow may share a wide range of genres on Openwhyd, and that you might be interested in following just one or two of their playlists. That’s a feature that I’ve wanted badly to have too!

Unfortunately, this feature would have a heavy footprint on Openwhyd’s source code and infrastructure. Therefore it would require a lot of work from developers, to implement and maintain it over time. So far, none of our contributors offered this kind of commitment. If you would like to help, please say hi there: https://github.com/openwhyd/openwhyd/issues/129

### Is there a “dark mode” design of Openwhyd?

We don’t provide design customisation features, sorry…

That being said, several browser extensions exist to help to change the design of any website. For instance: https://chrome.google.com/webstore/detail/stylish-custom-themes-for/fjnbnpbmkenffdnngjfgmeleoegfcffe

### Is it possible to edit a playlist collaboratively?

We started working on collaborative playlists several years ago, but ended up cancelling that feature because it was making our product more complicated and confusing to use, and it was costly to implement and maintain. ❌

Developers, if you ever want to give life to this feature in your own version of Openwhyd, there are still traces of its foundations in Openwhyd’s source code! (https://github.com/openwhyd/openwhyd)

### How many users are using Openwhyd? (among other stats)

You can find an infographic with a few facts and numbers [there](https://www.facebook.com/openwhyd/photos/a.1159960527358541.1073741828.1156477841040143/1576795475675042/?type=3).

### Can’t we display advertising to raise money, so that we can pay developers to add new features?

We did think of that, when the Openwhyd platform was still the main product of the Whyd company.

Based on its usage (i.e. the website is kept in the background all the time), our conclusions were that displaying advertising would not bring enough cash to pay the development of the platform. 💸

We also thought of [other ways to generate revenue](https://github.com/openwhyd/openwhyd/issues/101#issuecomment-336666263), but they are controversial: play audio ads between tracks, integrated sponsored music tracks in your stream, heat up your CPU to mine bitcoins while you’re playing music…

Now, here are reasons why I believe that it’s better for Openwhyd to rely on donations and sponsoring:

- It gives users (especially non-developers) an opportunity to contribute to sustaining Openwhyd. I.e. show actively that they care about the platform.
- Seeing that users still donate to sustain the project, developers are more motivated to contribute, because they know that at least these users will really care about these contributions. In other words, the presence of donations indirectly increase the value and impact of contributions.
- Also, I’m not a lawyer, but remaining a human-sized and non-profit project makes us less of a threat to music right-holders and streaming platforms. Complaints are easier to deal with when you don’t make money.

For all these reasons, I prefer to stick to donations and partnerships to support the costs of Openwhyd’s technical infrastructure, and rely on intrinsic motivation of developers who want to get involved in evolving the project. ✊

### Why don’t we host Openwhyd on a cheaper hosting server, to reduce costs?

DigitalOcean has been our hosting provider for years. It’s not cheap, but we picked an extremely performant and reliable solution to maintain an awesome quality of service without spending too much time caring about our infrastructure.

When we decided to turn Whyd into an open-source project, it was running on a very powerful server that costed $150/month. With help from the team, I migrated it to a smaller instance, in order to reduce that cost to $48/month. This process was risky and tedious, because our codebase was getting old (i.e. relying on deprecated dependencies) and we were lacking internal documentation on how to do this migration properly.

Sure, we could migrate to an even smaller server, but the platform may become slower. Or we could switch to a cheaper provider, but who is going to commit to maintain the infrastructure 24/7 in case of problems? In both cases, I’m not interested in spending time migrating anytime soon. ✋

Moreover, DigitalOcean loves Openwhyd, so they offered us 1 year of free hosting! 😍

### By doing XXX or ZZZ, Openwhyd can become a major player in the market and attract many more users

I would like to make this clear: the goal of Openwhyd is not (and will never be) to make money. It’s not a business, it’s a non-profit and collaborative project. It will always be.

Our objective is not to “win” anything or anyone. It’s rather to sustain a platform that our community of music lovers use to discover, play and share music. Its also a good project for developers to gain experience collaborating on a real-world open-source product and improve their programming skills.

As explained in [my previous article](https://medium.com/openwhyd/the-future-of-openwhyd-9a39e0839ac3), my vision for the future of Openwhyd is about empowering developers to implement their ideas on top of Openwhyd’s platform. Make it easier for them to create external applications (e.g. mobile apps, different UIs, additional features…) that Openwhyd users could use to enhance their experience. (i.e. similarly to applications that allow you to connect to your Facebook account)

If you wish for a better Openwhyd and want to hire developers to make it, you can freely fork [Openwhyd’s source code](https://github.com/openwhyd/openwhyd) and create your own version of it from the existing implementation. That’s one of the good things about open sources licenses like the one we’ve chosen (MIT license). But keep in mind that I will not be involved in such a project.

### If Openwhyd ever dies, how can I get my data back?

Don’t worry too much about that. 😌

As a music lover, I care a lot about the safety of the collection of tracks I’ve maintained for years on [my Openwhyd profile](https://openwhyd.org/adrien). So I’ve put everything in place so that no one ever loses their tracks!

Firstly, you can export your data (e.g. tracks and playlists) in standard JSON format at anytime, as explained [in this FAQ](#how-to-export-my-tracks--comment-exporter-ma-musique-en-csv-ou-json-).

Secondly, Openwhyd will only die if we ever run out of donations. So, if you really don’t want to let it die, you can help keeping our tanks full by donating through our Open Collective page: https://opencollective.com/openwhyd

Last but not least, I backup all Openwhyd’s data every week. So, if something bad ever happens on our technical infrastructure, I will still be able to recover and provide a recent snapshot of your data.

### I'd love to contribute to Openwhyd, how can I help?

Openwhyd is a collaborative / open-source project. Contributions of many kinds are welcome! 🤗

If you're a **developer**:

- Feel free to say _hi!_ on any issue or task listed in our [GitHub Project](https://github.com/openwhyd/openwhyd/projects/1);
- Help on replicating, investigating and fixing bugs is particularly appreciated. And beginners are welcome too!
- Here's some useful documentation for contributors: our [roadmap](ROADMAP.md) and [contribution guide](CONTRIBUTING.md);
- Also, you can bring your laptop to the next [Hackergarten meetup](https://www.meetup.com/fr-FR/Paris-Hackergarten) (happening in Paris every month), if you want to meet [Adrien](https://github.com/adrienjoly) and contribute on Openwhyd with him.

Otherwise, you can:

- join and start discussions in [our Facebook group](https://www.facebook.com/groups/openwhyd/),
- [donate](https://opencollective.com/openwhyd/donate) to help us cover Openwhyd's maintenance costs,
- and/or show Openwhyd to your friends, because it's so much cooler than Spotify! 😎

If you would rather talk to us privately, please come [say _hi_](mailto:contact@openwhyd.org)!

### Can we organise a party with fellow Openwhyd users?

That would be awesome! 🎵🍻🎉

If you want to organise one, I’m happy to help!

Good first steps would be to pick a place, a date, and convince at least 10 people to come. Go go go!

### How to contact Openwhyd's team?

Contact us at contact@openwhyd.org, or through our [Openwhyd Music Lovers Club, on Facebook](https://www.facebook.com/groups/openwhyd/). Our community of volunteers and users will do their best to help!

## Technical questions / support

### Track skipping problem / les morceaux sautent / ne s'enchainent pas ?

Try to refresh the page and click again on the track to see if it plays.

- If it does not, try opening its source URL to another tab by right-clicking on it, and play it from there.
  - If it does not play from its original location (e.g. Youtube page), there is nothing we can do, unfortunately...
  - If it does play from there but not from Openwhyd, it could be caused by geographical limitations (i.e. for technical reasons, the track must be allowed to be streamed in France), or that our player is broken. => Please let us know by sending us the Openwhyd URL of your track.
- If it does play after refreshing the Openwhyd page, it could be that your web browser does not allow playback of streaming content in the background (i.e. while doing something else.) In that case, try installing [Openwhyd-electron](https://github.com/openwhyd/openwhyd-electron/releases/) on your computer, by selecting your operating system from the list.

### I can't add / bookmark a track from Youtube ...

![screenshot](https://scontent-cdg2-1.xx.fbcdn.net/v/t31.0-0/p180x540/19243083_10213413094510997_2243898622608810090_o.jpg?oh=ec7af0fc25de2e7fc692d7ac575afb49&oe=59CCB0FB)

Solutions:

1. Try uninstalling and re-installing the extension;
2. Empty your browser's cache;
3. Or uninstall and reinstall your web browser.

It could also be that this track is not accessible from France, as explained in the answer above.

### How to export my tracks / comment exporter ma musique en CSV ou JSON ?

🇬🇧 First off, don't worry! Like you, we really care about our 5+ years of music curated with love on Openwhyd! And, whatever happens, we would never let Openwhyd _die_ without warning the community beforehand.

That being said, it's very easy to download your data at any time: just add the `?format=json&limit=999999` suffix to your Openwhyd profile URL. E.g. `https://openwhyd.org/adrien?format=json&limit=999999`

For more information about how to download data from Openwhyd, read our documentation of [Openwhyd Data Export API](./API.md#openwhyd-data-export-api).

🇫🇷 Tu peux récupérer tes tracks à tout moment, en ajoutant le suffixe `?format=json&limit=999999` à l'URL de ton profil Openwhyd. Exemple: `https://openwhyd.org/adrien?format=json&limit=999999`

### Do you have an API ?

Yes, check [our API documentation](API.md).

### The player says “Embed too small” or something like that, and wont play my music!

Yeah, this happens, the embed is about as small as it can be without breaking the rules, but that sometimes means that when people have a zoom on their browser that the window is too small to play the media. Check the “View” tab and set it to 100%, that should fix the problem in most cases.

### Sometimes a track doesn’t play at all, or it says that I have to go to YouTube to view the content.

Well, it’s true, there is some music that cannot be embedded onto other sites without explicit permission from the rights holders. If we don’t have an agreement in place you have to go to YouTube to watch it. But don’t worry, we are working on a bunch of solutions to that very problem!

Other times the player is trying to activate the media but the connection slows down for whatever reason and the play action times out. In this case the player skips to the next song. Try clicking on the song that was skipped, most of the time it will start playing. This problem comes from the fact that with continuous playback there are certain conditions that must be set to make sure that your music doesn’t get stuck on a track that’s acting a little unruly.

But overall keep in mind that we support music from a lot of different sources, and these sources are continuously evolving and changing, so we strive to make 99% of tracks work, and we are definitely hitting our goal!

### When I click on a track it takes me to the Soundcloud page!

That happens too, try refreshing the Openwhyd page.

### The video plays on top of the notifications panel!

Yeah, that’s because of Flash. Please try again after activating the HTML5 mode of Youtube (http://youtube.com/html5), and contact us if you still experience this issue.

### How to scrobble/track listening history to last.fm?

For a audioscrobbling to work:

1. Open openwhyd.org in your web browser
2. Make sure your logged in
3. In openwhyd settings, make sure that your lastfm account is connected
4. Go to your openwhyd profile page
5. Play a song entirely, without skipping into the track
6. Go to your lastfm profile, check that the tracks appears in your listening history

### Other: I have a problem that you didn’t mention here, what should I do about it?

Contact us at contact@openwhyd.org, or through our [Openwhyd Music Lovers Club, on Facebook](https://www.facebook.com/groups/openwhyd/). Our community of volunteers and users will do their best to help!

_Never stop jamming!_
