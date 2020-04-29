---
title: Asking for help in Slack/IRC
date: '2019-05-29T21:21:00.284Z'
description: How to ask great questions for technical help in Slack / IRC
---

> **tl;dr - please include the following with your slack message!**
>
> - What repo are you working on?
> - Is it currently failing on master?
> - A **_full_** stack trace (or link to CI/test failure. Include the command you ran!)
> - A **_full_** diff of your changes
> - What host are you on?

Here are some tips for what to include in your message when asking for technical help in Slack. The quicker/easier it is for the channel onpoint to understand your question, the quicker you will get the answers you are looking for!

In general, the best questions are those that include the most detail. Read on more for about what this means.

Thanks for helping keep things running smoothly in Slack! :)

## Step 0: Search on Slack / Docs

It's possible someone has already experienced similar issues to you. Before asking the question, spend a few minutes searching through Slack/IRC/company wiki/docs etc to see if you can find any answers there!

### Ask Your Mentor / Knowledgable Team-mates 🤔

**Mentors** can help answer common questions that you may encounter when getting started in a new project or development environment. It helps to ask them before going to another channel for assistance. Furthermore, they can help point you to the correct team if they are unable to answer the question themselves.

**Additionally**, you might have folks on your team who know more about the tool you're looking for help with. Ask them! Leverage the knowledge already within your team and pass it on! :)

## Step 1: Ask the Question! 📣

Hop into the channel and ping the onpoint! [Don't ask to ask](http://rurounijones.github.io/blog/2009/03/17/how-to-ask-for-help-on-irc/), just go straight ahead with your question!

Include the following key bits of information:

-   What repo are you working on?
-   Is it currently failing on master?
-   A **_full_** stack trace (or link to CI/test failure. Include the command you ran!)
-   A **_full_** diff of your changes
-   What host are you on?

## Bonus Step: Create a Small Repro 😊

Sometimes, error states are particularly complex or hard, or it's just not clear where the error is coming from. Consider providing a minimal set of steps, or minimal diff such that the channel onpoint may reproduce the error state locally, without having to dig through _all_ of your changes.

A [_"Minimal, Reproducible Example" (MRE)_](https://stackoverflow.com/help/mcve) is the gold standard here, and elaborates on this method.

In paring back your changes to an MRE, we:

-   reduce the search space for potential "bugs"
-   save the channel onpoint time in searching through a huge diff
-   look again at error with a slightly different perpsective - in doing so, we may [realize a fix ourselves!](https://en.wikipedia.org/wiki/Unintended_consequences)

Tools like [Try Flow](https://flow.org/try/), [CodeSandbox](https://codesandbox.io/) and [Repl.it](https://repl.it/) are great ways to quickly share code without the overhead of making a new directory, repository etc.

> 🚨 Don't share sensitive company code on these sites - replace anything proprietary with "Foo", "Bar" etc

Questions with MREs are the _very best_ kind of questions one could hope to receive - your channel onpoint will love you greatly if you follow this!

# Acknowledgments and Prior Art

-   http://rurounijones.github.io/blog/2009/03/17/how-to-ask-for-help-on-irc/
-   https://stackoverflow.com/help/mcve
-   https://meta.stackexchange.com/questions/66377/what-is-the-xy-problem
