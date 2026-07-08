---
title: Preventing LLM unit test spam
pubDate: '2026-07-08'
description: Stop the unit test spam
---

**I don't want to read, or ship, thousands of lines of LLM-written unit test spam.**

By default, LLMs will correctly test every codepath and achieve 100% coverage.
And it will happily churn out hundreds of brittle tests to do so.

_(LLM-written granular unit-test assertions remind me more of [snapshot
tests](https://jestjs.io/docs/snapshot-testing) than actual tests.)_

As a human, I simply can't review that many tests! Realistically, I suspect it
drives folks to do this:

<figure>
  <img src="/images/test-slop/homer.png" alt="Homer shipping yet another vibe-coded PR with 100s of tests" />
  <figcaption>Homer shipping yet another vibe-coded PR with 100s of tests</figcaption>
</figure>

## Keep a high test-to-coverage ratio

Prefer fewer tests that each cover more logic.

**❌ Bad**

```python
def test_event_initial_status_is_pending_review():
    event = create_event(name='Taco Tuesday', location="Taco Bell", host=123)
    assert event.status == 'PENDING_REVIEW'

def test_event_initial_attendees_includes_host():
    event = create_event(name='Taco Tuesday', location="Taco Bell", host=123)
    assert event.attendees == ['Homer S.']
```

**✅ Good**

```python
def test_create_event_basic():
    event = create_event(name='Taco Tuesday', location="Taco Bell", host=123)
  
    # events are reviewed before being published
    assert event.status == 'PENDING_REVIEW'
  
    # attendee list should automatically include the host
    assert event.attendees == ['Homer S.']
```

<br />

## Testing at the edges

I’ll refer to a classic KCD blog post for guidance here:

> Write tests. Not too many. Mostly integration. \
<small>~ https://kentcdodds.com/blog/write-tests</small>

In short, tell your agent to read that post and “test at the edges” of the
system. Avoid many granular unit tests and avoid mocking (where possible).

Write integration-style tests that send real inputs and
assert real world behavior or output. This applies to:
  - CLI inputs and output
  - Files written to disk
  - (Stubbed out) network requests made
  - For testing React UIs: using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) to “click on buttons” etc

**Note**: I say "integration-style" because I don’t think you should need to
spin up actual services with docker or set up sandboxes. Many libraries and
services ultimately do simple i/o that can either be stubbed out in-process
(e.g. [network
requests](https://blog.pecar.me/disable-network-requets-when-running-pytest/)),
or for testing filesystem operations, [using temporary
directories](https://docs.pytest.org/en/stable/how-to/tmp_path.html).

Testing at the edges is great. The main selling point is usually that because
tests are less coupled to “helper functions”, they are less brittle and can
don’t have to change when restructuring or swapping out internal logic.

But another benefit is: **less test code overall** 🙂
