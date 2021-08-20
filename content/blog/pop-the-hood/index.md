---
title: To understand anything, keep popping the hood.
date: 2021-08-20T12:00:00.284Z
description: You have the ability to understand anything. High five!
---

_This post is aimed at newcomers, and as a pep talk for all :)_

**You have the ability to understand anything.** High five!

As such, you have the tools to deal with any stacktrace your computer can throw
at you.

![](./how_hard.png '#margin=20px 0')

Errors from unfamiliar parts of the stack can be scary to deal with. Conversely,
it feels easier to debug stuff we are familiar with. Which makes sense - we’re
better equipped due to our prior knowledge and experience with the codebase.

But here’s the thing! It doesn’t matter where along this line the issue is. Given
enough time, you have the ability to understand - and then debug anything.

## Pop the hood

Let’s say we have an error that seems to be coming from code we don’t own or know
about. For example, the company-wide React `<Button>` component. It was written
and owned by a different team.

Assuming we’ve tried the basics ([Googling it][google-errors], searching on
Slack, [minimal repros][minimal-repro], asking Alexa), and the error still
persists, we now have two options:

[google-errors]: https://dev.to/swyx/how-to-google-your-errors-2l6o
[minimal-repro]: https://stackoverflow.com/help/minimal-reproducible-example

1. Ask someone else - a mentor or the other team's oncall. Since we don’t own or
   know anything about the internals of the layer that’s failing, let’s go ask
   someone who does.
2. Pop the hood open and take a look. Read the source code and understand the
   relevant bits of the code that’s failing.

![](./man-open-hood.jpeg '#margin=20px 0')

It's always worth trying option 2 first. If there’s an oil leak, don’t drive the
car straight to the garage - pop the hood open and see how the oil flows through
the engine. Maybe you can feel yourself where the problem is :)

_(This doesn’t imply we should spend days or weeks on end debugging in isolation -
[timeboxing](https://en.wikipedia.org/wiki/Timeboxing) is a good strategy to
employ.)_

To understand the stack trace, we have to read the source code that produced it.
In most cases, this will be available to search through somewhere - be it inside
of node_modules, the company GitHub, public GitHub etc.

So if the error is coming from the `<Button>` component - you can read the source
code for it! Maybe the bug turns out to be deeper down - in a shared React hook,
or a state management library - or maybe even React itself? You can keep reading
the source code all the way down.

More generally, we can build a picture of how an app works by looking at its
source code (and any available documentation) to understand what it’s intending
to do.

For example:

- [To debug a stack trace][debug-stack-trace], we can read the source code to
  understand what nested functions are being called to identify the bad line of
  code
- To find why an endpoint exists and where it's defined, we can use SourceGraph
  or [git grep](https://git-scm.com/docs/git-grep) to search for the string and
  hunt for its definition
- If a Docker container is failing to start due to missing files in the volume,
  we can look at the Dockerfile and the .dockerignore file to see what it’s being
  built with
- If an expected environment variable isn’t found, we can look at the build
  config or relevant bash scripts to inspect what variables are defined
- etc...

[debug-stack-trace]: https://www.scalyr.com/blog/javascript-stack-trace-understanding-it-and-using-it-to-debug/

You can usually always find out why something is the way it is by looking at
some code somewhere. Just keep popping the hood!

### Other engineers have no superpowers. All we do is pop hoods.

It's worth calling out that whenever you ask a channel oncall or mentor and they
don't know the answer off the top of their heads - they're likely just going to
go through a similar process to what's described above. The same as you or anyone
could do :D

### Mechanics of debugging

There's lots of tutorials and explainers on the internet which guide you through the mechanics of debugging, Here are some ones I like:

- <https://twitter.com/b0rk/status/1409513645256630274>
- <https://wizardzines.com/comics/minimal-reproduction/>
- <https://dev.to/swyx/how-to-google-your-errors-2l6o>
- <https://wizardzines.com/comics/change-one-thing-at-a-time/>
- <https://wizardzines.com/comics/understand-the-bug/>
- <https://jonskeet.uk/csharp/debugging.html>

## Summary

Having the confidence and ability to dive into unfamiliar code is crucial - not
just for unblocking yourself, but also:

- Working with legacy systems that nobody at the company knows about any more
- When mentoring or pairing with a teammate on their new code
- Sometimes the root issue is somewhere deep in infra and you need to debug
  linuxy stuff 😬

**tl;dr:** Got a weird error message? Keep popping the hood to find out why!

### Appendix: For time management; cram, don't study.

This post doesn't imply we should all spend infinite time learning everything
about every tool.

I think it's worth spending more time going deep on our everyday tools - and
gradually less for everything else.

![](./worth_time.png '#margin=20px 0')

The goal isn't to become an expert at everything. That's unreasonable. The goal
is to feel comfortable enough to dive into any tool so you can get to the root of
the issue. The more times you do this, the easier it becomes for next time!

It's kind of like [cramming][cramming] for a test the night before. You only need
to read enough to pass the test, and you probably won't remember any of what you
learned the week after! The real skill you're developing is how to digest and
understand information quickly. Probably not the best approach for school, but
I'd say it's a great skill for software engineers :P

[cramming]: https://en.wikipedia.org/wiki/Cramming_(education)