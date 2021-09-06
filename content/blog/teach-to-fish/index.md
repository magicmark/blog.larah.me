---
title: Teaching people to fish
date: 2021-09-06T12:00:00.284Z
description: When and how to not directly give answers as a mentor.
---

Remember this classic quote:

> Give a person a fish and you feed them for a day. Teach a person to fish and you feed them for a lifetime.

The same thing applies to being a mentor, or a support slack channel oncall.

If you get asked “hey why is X not working”, and it’s something that can be
easily found via docs or some debugging, don’t straight up give the answer.

We want to train folks to find those answers for themselves. Instead of saying
“oh yeah X isn’t working because of Y”, walk them through how they could discover
Y for themselves.

- You could just link them to the wiki page that documents Y. Better to provide
  the search term you used to get there, and share how stuff is commonly
  documented in the wiki in general.
- You could just link them the line of code in GitHub/SourceGraph that defines
  the behavior of Y. Better to show them how to use git grep and figure out which
  repo Y lives in, and share the knowledge of how to use SourceGraph to find code
  in general.

Teach them to fish.

(But don’t go overboard! We still want to be friendly and approachable and not
have people stuck spinning their wheels for days on end.)

\* * *

_(This post pairs well [To understand anything, keep popping the hood][pop-the-hood],
which is relevant to question askers)_

[pop-the-hood]: https://blog.larah.me/pop-the-hood/