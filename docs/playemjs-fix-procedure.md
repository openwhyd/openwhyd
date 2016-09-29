# Playemjs Fix Procedure

On Openwhyd, tracks are played by a 3rd-party library called [Playemjs](https://github.com/adrienjoly/playemjs).

The distribuable/compiled files of Playemjs are stored in:

- `/whydJS/public/js/playemjs-all.js`
- `/whydJS/public/js/playemjs-min.js` (minified version of `playemjs-all.js`)

When a track is skipped, two tracks are played at the same time, or other playback problems happen on Openwhyd, it probably means that it should be fixed in Playemjs, rather than on the Openwhyd repository itself.

In this document, my objective is to help fellow contributors on:
- how to diagnose a playback issue,
- how to fix the issue,
- and how to integrate the fix cleanly into Openwhyd,
- while keeping Playemjs and Openwhyd separate.

## Why use a separate repo for playback?

Good question! *(If you're in a hurry, you can skip to the last point, but please keep at least that one in mind)*

I have three reasons in mind:

1. Before Whyd was a music curation service, I (Adrien Joly) had developed a simple website that would play Youtube videos from your Facebook feed, in sequence, like if it was TV. This open-source side-project was called [Play'em](https://github.com/adrienjoly/playem). As we discovered that the early version of Whyd was mostly used to share music videos, we figured that it would be nice for our users to be able to play these videos sequentially, similarly to what I had implemented on Play'em. So I agreed to merge Playem's code into Whyd's codebase, to try this hypothesis. That's how Whyd pivoted from "topic-based  curation" to "music curation". I spent a substancial amount of time adding support for several streaming sources to the core Playem component (e.g. Soundcloud, Vimeo, Deezer, Bandcamp, MP3s...), and fixing them too, for Whyd. A few months/years later, I asked Whyd founders if I could open-source this component, as it was based on my own code which was open-source. A convincing incentive for them -- IMHO -- was that maintaining this closed-source codebase was a lot of work, and that we could leverage external contributions if anyone (outside of the company) wanted to add support for additional streaming sources. They accepted! So, whereas WhydJS was still closed-source at that time, the "playback" part of that codebase became open-source. And I decided to call it PlayemJS.

2. Multi-source playback on the web is complex (because of the heterogeneity of streaming APIs and SDKs), ever-evolving (because APIs and SDKs change and break sometimes), and can be used for many interesting use cases (i.e. for other web apps). By maintaining Playemjs separately, we make sure that the corresponding efforts can be capitalized over more than just one project (i.e. Openwhyd).

3. Lastly (but not least), it's less monolithic than having Openwhyd's entire codebase in one repository. So it's better in terms of separation of concern. (i.e. best practice in software development)
