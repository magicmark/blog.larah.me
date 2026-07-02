---
title: "The Case for Service-to-Service GraphQL"
pubDate: '2026-06-25T21:21:00.284Z'
description: |
  Using GraphQL for service-to-service communication is not necessarily an
  anti-pattern. In many cases, it's actually turns out to be a great choice!
---

I gave a [talk at GraphQL Conf 2026][talk] about using GraphQL for
service-to-service communication. This post is a (shorter!) written version of
that talk.

[talk]: https://graphqlconf2026.sched.com/event/2IPbF/service-to-service-graphql-the-new-sweet-spot-mark-larah-yelp

**tl;dr**: If you're already investing in a GraphQL API for public clients,
using it for internal service communication is _not_ necessarily an anti-pattern.
I would argue in many cases, it's actually the most pragmatic choice :)

Specifically, this is where I think it makes the most sense:

![](/images/service-to-service-graphql/ideal_conditions.png max-height=400 center)

<br />

## Historical Context

GraphQL is typically sold (exclusively) as a solution for client-to-service
communication. See: Marc-Andre's excellent blog post:
["The GraphQL Sweet Spot"](https://productionreadygraphql.com/blog/2020-05-14-sweetspot).
To be clear, I still largely agree with this! Client-to-service is where the
built-in benefits of GraphQL pay off most (e.g. collocating UI components with
Fragments for declarative data fetching, normalized caching in clients, client
defined field selection).

If we're evaluating the "best" data transport protocol _purely_ for
service-to-service, binary protocols "win" on raw performance alone (e.g.
[gRPC](https://grpc.io/), [cap'n'proto](https://capnproto.org/),
[bebop](https://github.com/6over3/bebop) to name a few).

One might reasonably assume the implication of these common wisdoms is that the
best architecture would be to combine these approaches, i.e. a public GraphQL
API layered over a set of gRPC service endpoints. This is largely how GraphQL
originally evolved at many companies (although more commonly with REST).

More recently however, the industry has shifted towards
[GraphQL Federation][federation] as a way to deploy and orchestrate GraphQL
across multiple services, replacing the need to wrap endpoints. So you may
already have GraphQL resolvers in your services, and therefore _technically_
already be doing service-to-service GraphQL, via the Federation Router! :)

[federation]: https://graphql.org/resources/federation/

So, do we still need multiple APIs? Keep REST/gRPC for internal services and
GraphQL for public clients? Let's look at the code-overhead of doing so.

## Maintaining Multiple APIs

Assuming we now have both GraphQL resolvers _and_ existing gRPC/REST endpoints,
we have (at least) two APIs over the same sets of data. The trap we might fall
into is this -- duplicated data definitions over the same underlying data.

![](/images/service-to-service-graphql/avoid.png)

Clearly it would be a bad idea to duplicate API handler logic over the same data
types each time. A separate [business logic layer][logic-layer] and/or using
code generation tools such as [ent][entgo] or [TypeSpec][typespec] is a well
established pattern to keep things as DRY as possible. This certainly helps,
but some logic cannot easily be normalized into a shared abstraction.

[entgo]: https://entgo.io/docs/code-gen
[typespec]: https://github.com/microsoft/typespec/issues/4933

### Per-API differences

One such example is error handling. Our internal REST API might simply do this:

```python
@router.get("/business/{id}")
def get_business(
   id: int,
) -> BusinessResponse:
   business = lookup_business(id)

   if business is None:
       raise HTTPException(
           status_code=404,
           detail=f"Business {id} not found"
       )

    return BusinessResponse(
        id=business.id,
        name=business.name,
        opening_time=str(business.opening_time),
        closing_time=str(business.closing_time),
    )
```

Whereas our GraphQL resolver over the same data might instead use
[error unions](https://sachee.medium.com/200-ok-error-handling-in-graphql-7ec869aec9bc):

```python
@strawberry.type
class Query:
    @strawberry.field
    def business(self, info, id: strawberry.ID) -> Union[
        Business,
        BusinessNotFound,
    ]:
        business = lookup_business(id)

        if business is None:
            return BusinessNotFound(
                message=f"Business with id {id} not found"
            )

        return Business(
            id=business.id,
            name=business.name,
            is_open=is_open(business.opening_time, business.closing_time),
        )
```

This would be awkward to bake into the `lookup_business(...)` business logic
layer. Per-API adaptor logic must be done per-API.

Oh by the way... also note that the REST endpoint returns the raw `opening_time`
and `closing_time` fields, whereas the GraphQL resolver returns a _derived field_
`is_open`. Oops! Without strict shared codegen, the data types that the public
and private APIs emit will likely drift apart based on the internal vs public
demands for data. This isn't necessarily a problem in itself and could be
considered natural layering of concerns, but does imply more per-API differences
and logic that lives outside a shared abstraction.

### Just use GraphQL

What if we consolidated on GraphQL? And let all client types, regardless of
who or where they are in your application stack all fetch (mostly) the same data
from the same API? 😱

```graphql
type Business {
  id: ID!
  name: String!
  isOpen: Boolean!
  openingTime: String! @auth(role: [BUSINESS_OWNER])
  closingTime: String! @auth(role: [BUSINESS_OWNER])
}
```

In this world, we throw everything in GraphQL - both the public and private
fields. In GraphQL, fields are only fetched and executed on the server if they
were selected in the query - i.e. there's no risk to defining all fields an
object type might contain.

For data that was formerly private and inaccessible to public users, an [`@auth`
directive](https://graphql.org/learn/authorization/#using-type-system-directives)
(or similar) may be used to restrict public users from ever being to receive a
private-only field -- allowing more granular access controls than a simple
"private" vs "public" split. And for even more separation, _Schema Contracts_
are a common vendor feature* to ship different slices of the schema to different
consumers. This would apply well here to omit any known private-only fields
entirely from the public schema.
(<small>[Apollo](https://www.apollographql.com/docs/graphos/platform/schema-management/delivery/contracts/overview) [WunderGraph](https://cosmo-docs.wundergraph.com/concepts/schema-contracts) [Hive](https://the-guild.dev/graphql/hive/docs/schema-registry/contracts)</small>)

## Use Cases

## REST is stinky

But what about "direct" service-to-service use cases?


Even with a compile step or [shared modelling](https://typespec.io/),

 - some amount per-API code is
required.

abstraction.

Here are two such examples.

### Example 1: Derived Fields

Almost inevitably, the data models that the public and private APIs use will
diverge. Even with a compile step or [shared modelling](https://typespec.io/),
the difference in who consumes each API will surface the need to have different
fields on types (or worse, entirely different and overlapping types).

Consider the raw `Business` database model for a reviews website (such as Yelp):

```js
interface BusinessModel {
  id: string;
  name: string;
  phone_number: string;
}
```

The internal REST endpoint version for this data might expose the model as-is:

```python
@router.get("/business/{id}")
def get_business(
   id: int,
) -> BusinessResponse:
    # talk to the database, do business logic, etc:
    business = lookup_business(id)

    return BusinessResponse(
        id=business.id,
        name=business.name,
        phone_number=business.phone_number,
    )
```

But watch out! At Yelp, businesses can enable the
"[Call Reporting][call-reporting]" feature, where the UI should display a
proxied phone number instead of the raw phone number. Which means the public API
(i.e. the GraphQL resolver) does this instead:

```python
@strawberry.type
class Query:
    @strawberry.field
    def business(self, info, id: strawberry.ID) -> Business:
        # talk to the database, do business logic, etc:
        business = lookup_business(id)

        # look up the call tracking version of the phone number
        # (maybe from some other service with its own REST API)
        tracking_number = get_call_tracking_number(id)

        return Business(
            id=business.id,
            name=business.name,
            display_phone_number=tracking_number or business.phone_number,
        )
```

The call to `get_call_tracking_number(...)` lives outside of the shared
`lookup_business(...)` abstraction in order to avoid adding over-fetching and
adding unnecessary latency when calling the internal REST API. i.e. even with
code-generation tools, we likely will **still run into per-API differences that
must be handled manually.**

Or we could introduce a `lookup_business(include_tracking_number: bool)`
argument that each API sets accordingly. This still requires code differences
implementation, so doesn't solve

...but how about this instead?

```python
@strawberry.type
class Query:
    @strawberry.field
    def business(self, info, id: strawberry.ID) -> Business:
        # talk to the database, do business logic, etc:
        business = lookup_business(id)

        # look up the call tracking version of the phone number
        # (maybe from some other service with its own REST API)
        tracking_number = get_call_tracking_number(id)

        return Business(
            id=business.id,
            name=business.name,
            display_phone_number=tracking_number or business.phone_number,
        )
```


Note:
- the GraphQL API only exposes `Business.displayPhoneNumber`, whereas the
  private REST API needs to expose the "raw" phone number for internal
  administrative use cases.
- the call to `get_call_tracking_number(...)` lives outside of the
  `lookup_business` in order to avoid adding over-fetching and adding
  unnecessary latency when calling the private REST API.

`display_phone_number` is a "derived field", and  the call to
`get_call_tracking_number(...)` lives outside of the `lookup_business` in order
to avoid adding over-fetching and adding unnecessary latency when calling the
private REST API.



This is a basic example. We could of course just always calculate and return
`displayName` in the shared abstraction with minimal overheard. But there are
cases where calculating the derived field is expensive - for example, when a
business has "[Call Reporting][call-reporting]" enabled and we need to look up
the tracking number version of the phone number from another service.
Introducing and unnvessary 

but there are many other examples of derived fields where looking up  

  `phone_number` becomes a _derived field_.
A business may have the "[Call Reporting][call-reporting]" feature enabled,
meaning that the phone number displayed in the UI should be a proxied phone
number, not the raw phone number. Which means that the public GraphQL API must
look like this:

[call-reporting]: https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US


@router.get("/business/{id}")
def get_business(
   id: int,
) -> BusinessResponse:
   user_id = g.context.user_id
   business = business_from_id(session, user_id, id)

   if business is None:
       raise HTTPException(
           status_code=404,
           detail=f"Business with id {id} not found"
       )

    return BusinessResponse(
        id=business.id,
        name=business.name,
        opening_time=str(business.opening_time),
        closing_time=str(business.closing_time),
    )


At Yelp, `phone_number` may actually be a _derived field_. A business may have
"[Call Reporting](https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US)"
enabled, meaning that the phone number displayed in the UI should be a proxied
phone number, not the raw phone number. And if a different service knows about
this




But trusted internal services still need to be able to access the raw
phone number for admin panels and such.


the private API emit diverge. Even if you're using a shared  

### Example 2: Error Handling

Consider this REST endpoint

@router.get("/business/{id}")
def get_business(
   id: int,
) -> BusinessResponse:
   user_id = g.context.user_id
   business = business_from_id(session, user_id, id)

   if business is None:
       raise HTTPException(
           status_code=404,
           detail=f"Business with id {id} not found"
       )

    return BusinessResponse(
        id=business.id,
        name=business.name,
        opening_time=str(business.opening_time),
        closing_time=str(business.closing_time),
    )



We can normalize most of the logic, but there 


Such per-API logic leaks beyond the shared abstraction. 

[logic-layer]: https://graphql.org/learn/thinking-in-graphs/#business-logic-layer

Consider a "Business" model for a reviews website (such as Yelp):

```js
interface Business {
  id: string;
  name: string;
  phone_number: string;
  is_open: boolean;
}
```

At Yelp, `phone_number` may actually be a _derived field_. A business may have
the "[Call Reporting][call-reporting]" feature enabled, meaning that the phone
number displayed in the UI should be a proxied phone number, not the raw phone
number. But trusted internal services still need to be able to access the raw
phone number for admin panels and such.

The internal REST/gRPC data type must 

[call-reporting]: https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US

That means we can't
pipe the data straight out of a column in the database.
data objects, whereas the public clients (mobile and web clients) may only  "derived" copies of the same 

boundaries, and the

thin as possible   

## Alternative Solutions

There are some intriguing language or vendor specific options such as [GraphQL->gRPC][wundergraph],
[gRPC->GraphQL][linkedin] and

[wundergraph]: https://cosmo-docs.wundergraph.com/router/gRPC/grpc-services
[linkedin]: https://www.youtube.com/watch?v=Orgyp3xOqwY

These are however language or vendor specific. T

While 

The situation 
The worst case
Following t

## Raw vs derived fields

In a [service-oriented architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture),
it is almost always the case that trusted internal services and public clients
(mobile and web apps) need slightly different versions of data objects.

For example, consider a "Business" type for a reviews website (such as Yelp):

```sql
CREATE TABLE business (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255) NOT NULL,
  is_open BOOLEAN NOT NULL
);
```


At Yelp, `phoneNumber` may actually be a _derived field_. A business may have
the [Call Reporting][call-reporting] feature enabled, meaning that the phone
number displayed in the UI should be a proxy phone number, not the raw phone
number.

...
[call-reporting](https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US)

That means we can't
pipe the data straight out of a column in the database.
data objects, whereas the public clients (mobile and web clients) may only  "derived" copies of the same 

boundaries, and the
trust boundaries are often established 

In a microservices 
We have "internal" consumers of data (service-to-service) 
Consider 




by pairing them up (e.g. layering a GraphQL API over a gRPC service endpoints)
is the ideal approach.

knowlegde

But if we step back and consider a classic
[service-oriented architecture](https://en.wikipedia.org/wiki/Service-oriented_architecture)
for a web or mobile application backend, the overall cost of maintaining
multiple API definitions (over the same data!) must also be taken into account.

## Use cases

Two use cases have been pushing me to rethink this:

**LLM Agents.** If you're building agents that act on behalf of users, those agents need data -- the same business data your client apps already consume through your GraphQL API. The agent needs to look up a business's hours, check a user's bookmarks, read reviews. That's all sitting right there in your schema already.

The key insight is that an LLM agent operating on behalf of a user should be treated like any other client platform. It needs the same auth, the same authorization checks, the same business logic applied to the data. It's just another client alongside iOS, Android, and Web. If you already have a GraphQL API full of your business data, that's exactly what the agent needs.

**Server Driven UI.** When the server decides what UI to render, it also needs to decide what data to fetch. The layout is defined server-side and can change independently of client releases. When the layout changes, the data requirements change, and the backend needs to initiate requests for that data. The server becomes a client.

Both of these cases share a common thread: internal services that need the same data, with the same business logic applied, that your external clients already get from GraphQL.

## The maintenance tax

Say you have a `Business` type. It has a `phone_number` field -- but you can't
just return the raw database value, because for some businesses you need to
substitute a "call tracking number". It has `opening_time` and `closing_time`
-- but public-facing clients should see a computed `isOpen` boolean, while admin tools need the raw times.

This is business logic. It lives somewhere.

If you're serving this data through both a GraphQL API and a gRPC service (or REST, or whatever), you need that business logic applied in both places. The typical answer is "extract it into a shared business logic layer" -- and that works, to a point. But you still end up with:

- Duplicated type definitions (GraphQL schema types AND proto message types)
- Separate marshalling logic for each API
- Different error handling patterns per API surface
- Different fields exposed for different use cases

And it gets worse. GraphQL has features that don't map cleanly to a shared abstraction layer: dynamic field selection, dataloaders for batching, `@defer` for streaming, custom directives. The implementations diverge over time. You're maintaining two APIs that serve the same data but have increasingly different internals.

Tools like PostGraphile and Entgo can generate schemas from your data models, which helps. But once you have meaningful business logic beyond CRUD, you're back to writing it by hand somewhere.

## GraphQL as the consolidated API

If you're already running a GraphQL API that handles auth, caching, rate limiting, logging, experiment rollouts, and permission checks -- and internal services need the same data with the same rules -- why build a second API?

Consider a schema like this:

```graphql
type Business {
  id: ID!
  name: String!
  phone_number: String! @auth(requires: BUSINESS_OWNER)
  isOpen: Boolean!
  reviews(first: Int): [Review!]! @auth(requires: AUTHENTICATED)
}
```

The `@auth` directives handle field-level permissions. The resolvers contain the business logic (call tracking substitution, open/closed computation). This already exists. It already works for your web and mobile clients. When a cron job needs to send push notifications about businesses, when a webhook handler needs to ingest and validate third-party data, when an LLM agent needs to answer questions about a user's saved places -- they can all hit the same API.

GraphQL has become the business logic layer. And with Federation, you can compose these across teams while keeping backends DRY.

The resolver code isn't fundamentally different from what you'd write in a REST handler anyway. Compare a Strawberry (Python) resolver to a FastAPI endpoint -- the actual business logic is identical. The difference is that with GraphQL, you write it once and serve all your clients, internal and external.

## "But JSON is slow and big!"

This is the objection I hear most. And five years ago it would have been harder to dismiss. But the numbers tell a different story today.

Take a realistic payload -- a 20kb JSON list response. Apply zstd compression (which you should be using for any non-trivial payloads regardless of format):

- JSON + zstd: **2.8kb**
- Protobuf + zstd: **2.5kb**

The delta is about 300 bytes. On a 20kb payload. Over local networking (intra-AZ or intra-cluster), that difference is noise.

"But parsing!" -- also largely noise in practice for the payload sizes we're talking about. If you're shuffling megabytes of binary data between services, yes, protobuf parsing will be meaningfully faster. For the typical business data payloads (sub-100kb) that most services deal with, the parsing overhead of JSON versus protobuf is not your bottleneck. Your database query, your network hop, your business logic computation -- those dominate.

## Beyond JSON

That said, JSON doesn't have to be the end of the story for GraphQL. The GraphQL spec has a section on JSON serialization, which implies other serializations are possible.

Argo (github.com/msolomon/argo) is a binary format designed specifically for GraphQL responses. It takes advantage of the fact that both client and server know the schema and the query shape, so it can strip out redundant structural information.

WunderGraph's Cosmo router already supports gRPC transport between services while still exposing GraphQL to clients -- giving you the GraphQL developer experience with binary transport under the hood.

This space is early but active. The performance gap between GraphQL-over-JSON and gRPC-with-protobufs is already small for most use cases, and it's likely to shrink further.

## When this does and doesn't apply

I'm not arguing that every service should talk GraphQL. Here's the sweet spot:

- You have multiple internal clients that need data (cron jobs, webhooks, agents, SDUI servers)
- You have multiple external clients (web, mobile, third-party)
- Internal networking stays local (at minimum intra-availability-zone)
- You're already using or want to use GraphQL Federation
- Your payloads are small to medium (under 100kb)
- You're already using or want to use GraphQL for client-facing APIs

If you don't tick most of those boxes, this probably isn't for you. If codegen from your data models plus minimal templating solves your problem, keep doing that. If thin resolvers on a solid business logic layer work and you're happy maintaining multiple API surfaces, that's fine too. If the extra milliseconds or bytes from JSON transport are genuinely your bottleneck (you're doing high-frequency trading, processing massive binary blobs, etc.), then GraphQL isn't the right tool for that specific communication path.

But if you've already built a GraphQL API that handles auth, caching, and business logic -- using it for service-to-service communication isn't heresy. It's an excellent tradeoff that keeps your backend DRY and reduces the surface area you need to maintain.

## Wrapping up

Services-as-clients are no longer an edge case. LLM agents, server-driven UI, internal automation -- these are all services that need your business data with your business rules applied. GraphQL was designed for clients. Turns out, your backend services can be clients too.

If you want to keep your backend DRY and you're already in the GraphQL world, consolidating on a single GraphQL API for both internal and external consumers is worth serious consideration. The performance objections don't hold up under scrutiny for most workloads, the maintenance savings are real, and the use cases driving this aren't going away.
https://github.com/6over3/bebop


To be clear: 
been pretty clear: GraphQL is for clients,
gRPC (or similar) is for services. Marc-Andre Giroux wrote about it back in 2020 on productionreadygraphql.com. The Principled GraphQL guidelines echoed the same idea. And the reasoning made sense -- gRPC gives you protobufs (smaller, faster to parse), Kubernetes has built-in support for gRPC load balancing, and the ergonomics of code-generated clients from .proto files are genuinely good.


multi-seri
But of course, we cannot  services don't exist in a vacuum and we s

But And from a pure performance perspective

or that GraphQL is "better" than gRPC or
cap'n'proto or any other data transport protocol. On pure performance alone,
these other technologies do win -- but unless you're truly a hyperscale user
and transfering gigabytes of data between services in the critical path of a
request, this is unlikely to be your performance or cost bottleneck.

JSON parsing is fast!

Developer experien


is bad. From a pure performance and ergonomics standpoint, it's the more obvious
choice for service-to-service communication. But "obvious" and "optimal for your
situation" aren't always the same thing.



