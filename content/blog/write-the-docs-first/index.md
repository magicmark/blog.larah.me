---
title: Write the docs first!
date: '2023-02-15T09:45:00.284Z'
description: Working a new thing for other developers to use? Write the docs first!
---

If you’re working on a new infrastructure project (i.e. your customers are other developers), then my strong recommendation is **write some user documentation for it first** to show in your design doc.

Consider CLI tooling, library interfaces, config file formats etc - anything the user will interact with or depend on. Try sketching out what this looks like in a design doc up front - before spending weeks implementing it.

If appropriate, consider showing both:

- a “usage” section the shows a sample callsite or config file that implements the new thing; and
- a “specification” section that shows all the possible options/arguments/values of the new thing

_(Don't spend too much time getting this perfect - an informal Google doc to show the most important bits will usually suffice at this stage.)_

Even if you don’t know the implementation details of how the thing will be implemented, we can still decide the look and feel of the public interface first. I usually find it helpful to start here and write out a skeleton version of the thing without any actual implementation.

By doing this:

- Your reviewers can more easily understand what the new thing is and how it will work.
- You can receive feedback earlier in the iteration cycle if the implementation needs to be changed based on changes to the interface. (I’ve seen a few projects where code needs to be scrapped and reworked as a result of this.)

The best part is, you’d (ideally) end up writing documentation for this anyway, so this just front-loads that work :)
