# Playemjs Fix Procedure

On Openwhyd, tracks are played by a 3rd-party library called [Playemjs](https://github.com/adrienjoly/playemjs).

The distribuable/compiled files of Playemjs are stored in:

- `/public/js/playemjs-all.js`
- `/public/js/playemjs-min.js` (minified version of `playemjs-all.js`)

When a track is skipped, two tracks are played at the same time, or other playback problems happen on Openwhyd, it probably means that it should be fixed in Playemjs, rather than on the Openwhyd repository itself.

In this document, my objective is to help fellow contributors on:

- how to diagnose a playback issue,
- how to fix the issue,
- and how to integrate the fix cleanly into Openwhyd,
- while keeping Playemjs and Openwhyd separate.

## Prerequisite: Why use a separate repo for playback?

Good question! _(If you're in a hurry, you can skip to the last point, but please keep at least that one in mind)_

I have three reasons in mind:

1. Before Whyd was a music curation service, I (Adrien Joly) had developed a simple website that would play Youtube videos from your Facebook feed, in sequence, like if it was TV. This open-source side-project was called [Play'em](https://github.com/adrienjoly/playem). As we discovered that the early version of Whyd was mostly used to share music videos, we figured that it would be nice for our users to be able to play these videos sequentially, similarly to what I had implemented on Play'em. So I agreed to merge Playem's code into Whyd's codebase, to try this hypothesis. That's how Whyd pivoted from "topic-based curation" to "music curation". I spent a substancial amount of time adding support for several streaming sources to the core Playem component (e.g. Soundcloud, Vimeo, Deezer, Bandcamp, MP3s...), and fixing them too, for Whyd. A few months/years later, I asked Whyd founders if I could open-source this component, as it was based on my own code which was open-source. A convincing incentive for them -- IMHO -- was that maintaining this closed-source codebase was a lot of work, and that we could leverage external contributions if anyone (outside of the company) wanted to add support for additional streaming sources. They accepted! So, whereas Openwhyd was still closed-source at that time, the "playback" part of that codebase became open-source. And I decided to call it PlayemJS.

2. Multi-source playback on the web is complex (because of the heterogeneity of streaming APIs and SDKs), ever-evolving (because APIs and SDKs change and break sometimes), and can be used for many interesting use cases (i.e. for other web apps). By maintaining Playemjs separately, we make sure that the corresponding efforts can be capitalized over more than just one project (i.e. Openwhyd).

3. Lastly (but not least), it's less monolithic than having Openwhyd's entire codebase in one repository. So it's better in terms of separation of concern. (i.e. best practice in software development)

## Actual procedure

The procedure consists of the following steps:

1. **Be able to reproduce the issue on Openwhyd** (from openwhyd.org and on your local dev environment) => define it as precisely as possible (i.e. context, steps, outcome, and expected outcome), with help of the person who reported the issue.
2. **Identify this issue in the ticket management system** (i.e. Github Issues), or create it. Share data from step 1. Leave a trace that someone experienced this problem, and state your intentions. (keeping a precise history can help fix a stealthy bug)
3. **Make sure that there is a test in the [playemjs repo](https://github.com/adrienjoly/playemjs) that fails in a matching context** (cf data from step 1), or write that test and commit it with a message like "failing test for openwhyd issue #XXX".
4. **Make the test pass by fixing playemjs**, then -- after making sure you did not break playemjs' other tests -- commit your fix with a message like "fixed openwhyd issue #XXX".
5. **Make sure that this fix solves the problem on Openwhyd**: in your local `playemjs` directory, run `make build`, then copy the `/dist/playemjs-*.js` files to the `/public/js` directory of your local Openwhyd repository, and test step 1's scenario.
6. **If your fix solved the issue, you can commit to the [Openwhyd repo](https://github.com/openwhyd/openwhyd)** with a message like "playemjs fix for issue #XXX", and send a pull request.
7. **Go tell the person who reported the bug that you proposed a fix**, and that it should hopefully solve their problem on openwhyd.org soon (i.e. as soon as the pull request is accepted). My advice is to stay humble until you're sure that their problem is fixed, because shit happen.

## That's it for now!

As stated [there](https://github.com/openwhyd/openwhyd/issues/17), I'm thinking of ways to integrate Playemjs into Openwhyd in a cleaner/safer way.

If you have any constructive suggestions to make, be it on this document or on Playemjs' integration itself, please ping me! :-)
