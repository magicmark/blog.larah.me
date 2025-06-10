
---
title: Creating 'mess' directories
date: '2025-06-09T21:21:00.284Z'
description: Include this in .bashrc to quickly create a 'mess' directory
---

Here's a snippet from my `.zshrc` that I use pretty much every day:


```bash
# messing around? run `$ cdmess` to create and enter into a temporary "mess" directory
function cdmess {
    # there's no guarantee that tmp directories stick around, but timestamping them
    # is useful to be able to refer back to something from recent memory
    today_tmpdir="${TMPDIR-/tmp}/${USER}_mess/$(date +%F)"
    mkdir -p "$today_tmpdir"
    cd "$(mktemp -d -p "${today_tmpdir}" XXXX)"

    # also create a new python venv. might not need it, but this runs
    # pretty instantly so we might as well create it for free :)
    # if you want to install a python dep, use `pip install <foo>`
    virtualenv -q venv
    . venv/bin/activate
}
```

Cooler kids than I may wish to substitute `virtualenv` for `uv`, or include `echo {} > package.json`. Adapt for whatever workflow is most common for you.

This is great for when I want to play around and test out a script, create a throwaway node_modules or a venv etc. I find it easier to hack around in a fresh and isolated envionrment, rather than in whatever project directory i'm _actually_ working on. 

e.g. I want to check if the bug i'm encountering is present on the latest version of a dependency. `cdmess` often allows me to iterate quicker because i don't have to wait for the full build or server restart or whatever to complete.
