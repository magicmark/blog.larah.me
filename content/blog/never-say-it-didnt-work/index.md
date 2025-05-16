---
title: Never say "it didn't work"
date: '2025-05-13T12:00:00.284Z'
description: Be explicit when asking for technical support.
---

When asking for help in a support channel, or filing a bug report ticket, my simple rule is:

**Avoid the phrase “it didn’t work”**.

Be explicit. Tell us specifically what the “it” is.

Even if it’s obvious to you, the reader might not have your same context. Err on the side of overcommunication and lay it out for me, so I can help you quicker.

### Examples

❌ **Bad**: I tried running tests but it didn’t work\
✅ **Good**: I merged the branch, but CI was never triggered and the tests never ran in Jenkins

❌ **Bad**: Login doesn’t work\
✅ **Good**: After entering valid credentials on the login page, I’m redirected to /login again instead of /dashboard, and there’s no error message shown.

❌ **Bad**: The page is broken\
✅ **Good**: When I navigate to /dashboard, the page loads indefinitely and the console shows a 500 Internal Server Error from the getUserData API call.

### Related

- https://blog.larah.me/asking-for-help-on-slack/
