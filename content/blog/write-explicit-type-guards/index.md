---
title: Write explicit type guards
date: '2020-08-25T12:00:00.284Z'
description: How and why you should write explicit type guards, using JavaScript as an example.
---

Inside a function with arguments, you may want to write a guard to check that a parameter has been set before using it.

**Example:**

```js
function myMethod(foo: ?string) {
  if (!foo) {
    return;
  }

  console.log(`The value of the foo string is: ${foo}`);
}
```

Great! We checked the argument before trying to use it, making Flow/TypeScript happy and adding resilience to our code.

**In some cases, this is all you need** - and there's nothing wrong with this!

So when is this not ok? Read on...

## The dangers of type coercion

This approach of `if (foo)` above relies on [type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion) from a stringy value to a boolean value.

But what if our input is the empty string? Empty strings are falsey, so our function wouldn't print anything - maybe not what we wanted! This problem also affects numbers, boolean arguments, or anything else that could coerce to falsey.

So let's we want to allow for empty strings - we'll need to try something else. Maybe we could use [`===`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators#Identity) and check explicitly for `null`?

```js
function myMethod(foo: ?string) {
  if (foo === null) {
    return;
  }

  console.log(`The value of the foo string is: ${foo}`);
}
```

## type !== undefined

What if `foo` was `undefined`? That would pass the above guard and break our code, since `undefined !== null`! So we also need to check for that:

```js
function myMethod(foo: ?string) {
  if (foo === null || foo === undefined) {
    return;
  }

  console.log(`The value of the foo string is: ${foo}`);
}
```

Perfect - our guard now behaves as expected!

## Bonus: Check for types explicitly

`if (foo === null || foo === undefined)` is a bit tedious to write out each time.

Rather than _disallowing_ a known set of bad types (`undefined`, `null`), we can do even better and _only allow_ the type that you want:

```js
function myMethod(foo: ?string) {
  if (typeof foo !== 'string') {
    return;
  }

  console.log(`The value of the foo string is: ${foo}`);
}
```

This avoids any type coercion issues, and provides an extra runtime check that your inputs are the type you expect.

There’s not a huge amount of downside here, and explicitness is never usually a bad thing... If in doubt, go for this option.

### Takeaway

- remember that `undefined !== null`.  90% of the time you’ll want to guard against both values.
- even better is to explicitly check for the type you want, vs checking for types you _don't_ want!

### Reference

Here's a list of examples for how to check for various types:

| Type     | Check                       |
| -------- | --------------------------- |
| `Number` | `typeof myVar === 'number'` |
| `String` | `typeof myVar === 'string'` |
| `Array`  | `Array.isArray(myVar)`      |
| `Date`   | `myVar instanceof Date`     |
| `Object` | `typeof myVar === 'object'` |

## Further Reading

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators
- https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion
- https://2ality.com/2019/10/type-coercion.html
