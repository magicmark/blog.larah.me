---
title: "Filesystem mocking with unionfs and Jest"
date: '2025-08-18T12:12:00.284Z'
description: "Filesystem mocking with unionfs and Jest"
---

Mocking Node’s [`fs` module](https://nodejs.org/api/fs.html) can get tricky.
Especially if you want to mix real filesystem access with in-memory mocks. A
common approach with `memfs` and `unionfs` makes this possible, but it isn’t
always obvious[^issue] how to patch the filesystem with Jest mocking.

[^issue]:
    https://github.com/streamich/fs-monkey/issues/139

Here’s a working example:

```js
import { vol } from 'memfs';
import { ufs } from 'unionfs';
import fs from 'fs';
import path from 'path';

// remember to mock both fs and fs/promises + node: prefixed imports
jest.mock('fs', () => jest.requireActual('unionfs').ufs);
jest.mock('fs/promises', () => jest.requireActual('unionfs').ufs.promises);
jest.mock('node:fs', () => jest.requireActual('unionfs').ufs);
jest.mock('node:fs/promises', () => jest.requireActual('unionfs').ufs.promises);

// add your mock files here
vol.fromJSON({
  '/foo/bar/baz.txt': 'hello from mock',
});

// combine real fs and in-memory fs
ufs.use(jest.requireActual('fs')).use(vol);

it('unionfs', async () => {
  // mocked file works
  expect(fs.readFileSync('/foo/bar/baz.txt', 'utf8')).toBe('hello from mock');

  // fs/promises also works
  await expect(fs.promises.readFile('/foo/bar/baz.txt', 'utf8')).resolves.toBe('hello from mock');

  // real files work too
  // - this is useful for preserving logic that reads required system files that a dependency might assume exists.
  // - you can also *override* the value of this file in `vol.fromJSON` above.
  expect(fs.readFileSync('/etc/os-release', 'utf8')).toContain('NAME');
});
```

## Why this matters

- If you _only_ mock `fs`, you lose access to your actual project files.
- If you _only_ use `memfs`, you can’t test real paths.

By combining them with `unionfs`, you get the best of both worlds: real files where you need them, mocked files where you don’t.