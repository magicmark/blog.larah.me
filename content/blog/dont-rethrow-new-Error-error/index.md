---
title: Don't rethrow `new Error(error)`!
date: 2020-04-29T12:00:00.284Z
description: How to safely capture and rethrow errors without losing information
---

You may be tempted to rethrow an error object passed to you by a library or function call.

Here’s an example using Apollo’s `useQuery` hook:

```js
function Pets() {
  const { loading, error, data } = useQuery(GET_MY_PETS);

  if (loading) {
    return <PetListShimmerState />
  }

  if (error) {
    // let error bubble up and be caught by error handler somewhere else
    throw new Error(error);
  }

  return (
    <ul>
      <li key={pet.id}>{pet.name}: {pet.breed}</li>
    </ul>
  );
}
```

Or even more generically:

```js
foo((err, data) => {
  if (err) {
    throw new Error(err);
  }
})
```

At first glance this seems innocuous. We’re being responsible; writing guards that catch errors and throw them, before continuing with our application logic.

(Hopefully this bubbles up to an error handler defined somewhere else in the application, which would ultimately deal with the errors!)

## So what’s wrong with this?

Here’s the line we’re particularly interested in:

```js
throw new Error(error);
```

`new Error` as you might expect creates a _new_ instance of an error object. But in the useQuery example, the `error` variable is already an instance of `Error`!

This is a problem because **valuable stack trace information (and any custom error object attributes) will be thrown away and lost** when we create a brand new error object.

Specifically, it will hide where the error was originally thrown from in the stack trace. When you go to look at the stack traces you've collected, you'll see that they start from where you re-threw the error - not where the underlying error occurred.

## What should I do instead?

If you know that error is already an error object, you can simply rethrow it:

```diff
 foo((err, data) => {
   if (err) {
-    throw new Error(err);
+    throw err;
   }
 })
```

If you don't know the type or provenance of the error variable (maybe it's actually a string from a rejected promise), you can wrap the variable with [ensure-error](https://github.com/sindresorhus/ensure-error) before throwing:

```diff
 foo((err, data) => {
   if (err) {
-    throw new Error(err);
+    throw ensureError(err);
   }
 })
```

(`ensureError` comes from <https://github.com/sindresorhus/ensure-error>)

## Reproduction

Here's a runnable example so you can see the difference between these two approaches:

> <https://repl.it/repls/LowestFlatPixels>

## Bonus: What if I _do_ want to create a new error?

This is a totally legitimate thing to want to do! Maybe you have a custom error class that you want to throw instead, so you can provide better error messages.

It's still recommended to include the original error, so you get the best of both worlds. The following libraries help you to do that:

- https://github.com/joyent/node-verror
- https://github.com/sindresorhus/aggregate-error

## Further Reading

- https://www.joyent.com/node-js/production/design/errors
- https://nodejs.org/api/errors.html#errors_new_error_message
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error