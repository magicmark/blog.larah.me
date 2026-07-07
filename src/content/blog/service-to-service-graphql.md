---
title: "The Case for Service-to-Service GraphQL"
pubDate: '2026-06-25T21:21:00.284Z'
description: |
  Using GraphQL for service-to-service communication is not necessarily an
  anti-pattern. In many cases, it's actually turns out to be a great choice!
---

I gave a [talk at GraphQL Conf 2026][talk] about using GraphQL for
service-to-service communication. This post is a condensed written version of
those thoughts.

[talk]: https://graphqlconf2026.sched.com/event/2IPbF/service-to-service-graphql-the-new-sweet-spot-mark-larah-yelp

**tl;dr**: Using GraphQL for service-to-service communication is not an
anti-pattern. This is especially true if your org already uses GraphQL for
mobile and web clients — consolidating on GraphQL as a single API surface is a
very compelling option.

Specifically, here's where I think it makes the most sense:

![](/images/service-to-service-graphql/ideal_conditions.png max-height=400 center)

<br />

### Use Cases

Here are some good candidates in particular for using GraphQL on the backend:

**Server Driven UI:** This is a pattern employed at companies such as
[Netflix][netflix], [Airbnb][airbnb] and [Yelp][yelp] to enable the server to
make decisions about what UI widgets are displayed on the client. In many
cases, the SDUI payload sent to the client contains the data already embedded
into the component. Which means the SDUI backend service needs data from
somewhere...

[netflix]: https://graphqlconf2026.sched.com/event/2IPcY/screens-on-shuffle-how-netflix-scales-serverdriven-everchanging-pages-sreekanth-ramakrishnan-netflix
[airbnb]: https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5
[shopify]: https://shopify.engineering/server-driven-ui-in-shop-app
[yelp]: https://engineeringblog.yelp.com/2024/03/chaos-yelps-unified-framework-for-server-driven-ui.html

**LLM Driven UI:** A special case of the above -- pages driven by LLMs
(typically conversational UIs). The model needs product and user data in order
to generate a response. This could be via MCP, or some prefetched data baked
into initial context. Either way - we have a service that needs data!

**React Server Components:** This one feels like cheating, but still counts!
There's already [native client support][apollo-rsc].

[apollo-rsc]: https://www.apollographql.com/docs/react/integrations/nextjs#react-server-components

In all cases above, the data we provide may ultimately be displayed to end users.
Therefore it needs to have the same business logic and auth checks applied as
your existing external API - otherwise we risk leaking private information through
the model and back out to the user. So from a safety perspective alone, it would
be nice to directly reuse the external GraphQL API which already handles these
concerns... on the server :)

## The case _against_ service-to-Service GraphQL

If we're evaluating the "best" data transport protocol _purely_ for
service-to-service use cases, binary protocols offer an excellent developer
experience, and win on raw performance alone (e.g. [gRPC](https://grpc.io/),
[cap'n'proto](https://capnproto.org/), [bebop](https://github.com/6over3/bebop)
to name a few). More commonly used however, are old-fashioned REST endpoints
(ideally typed with Swagger/OpenAPI or similar).

A ["boring"][boring] stack would reasonably be:

- REST or gRPC for service-to-service communication
- GraphQL for client-to-service communication <small>(Yes, I think GraphQL counts as boring now!)</small>

[boring]: https://mcfunley.com/choose-boring-technology

The natural next step is combining these: an external GraphQL API layered over a
set of internal endpoints. This is indeed largely how GraphQL evolved and has
been deployed at many companies.

More recently however, the industry has shifted towards [GraphQL
Federation][federation] as a way to deploy and orchestrate GraphQL across
multiple services -- replacing the need to wrap endpoints with a big GraphQL
proxy service.

[federation]: https://graphql.org/resources/federation/

Which leads me to wonder: do we still need multiple APIs? Can we just reuse the
GraphQL resolvers for internal service use cases too? Surely this is blasphemy!

### "No! GraphQL is for clients only. Keep separate APIs."

In a situation where we maintain GraphQL resolvers _and_ existing gRPC/REST
endpoints, we have (at least) two APIs over the same sets of data. The trap we
might fall into is this -- duplicated data definitions over the same underlying
data.

![](/images/service-to-service-graphql/avoid.png)

Clearly it would be a bad idea to duplicate API handler logic over the same data
types each time. A separate [business logic layer][logic-layer] and/or using
code generation tools such as [ent][entgo] or [TypeSpec][typespec] are well
established patterns to keep things DRY and consistent. This certainly helps,
but some logic cannot easily be normalized into a shared abstraction.

[entgo]: https://entgo.io/docs/code-gen
[typespec]: https://github.com/microsoft/typespec/issues/4933
[logic-layer]: https://graphql.org/learn/thinking-in-graphs/#business-logic-layer

We still end up with:

- Per-API schema definitions (e.g. A GraphQL schema and an OpenAPI Contract)
- Different error handling patterns per API
- Different fields exposed for different use cases
- Features that don't map cleanly to a shared abstraction (e.g. `@skip`/`@include`)

For instance, let's take a closer look at error handling. The internal REST API
might simply raise a 404:

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

    return BusinessResponse(**business)
```

Whereas our GraphQL resolver over the same data might instead return
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

        return Business(**business)
```

This difference would be awkward to bake into the `lookup_business(...)`
business logic layer. Per-API adaptor logic must be done per-API.

Let's also zoom into the differences between the fields the external (GraphQL) and
an internal (REST) service might return for the same domain object:

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
<div>

<p style="margin-bottom: -0.5em;"><strong>External GraphQL API</strong></p>

```graphql
type Business {
  name: String!
  phoneNumber: String!
  isOpen: Boolean!
}
```

</div>
<div>

<p style="margin-bottom: -0.5em;"><strong>Internal REST Service</strong></p>

```python
class BusinessResponse(pydantic.BaseModel):
    name: str
    phone_number: str
    opening_time: str
    closing_time: str
```

</div>
</div>

How many differences can you see?

The internal version exposes raw `openingTime` and `closingTime` values -- but
real users can only see a computed `isOpen` boolean field (which
takes into account the user's timezone).

But did you also spot the difference in `phoneNumber`? Trick question! It looks
the same, but could actually be a totally different value -- because for some
businesses, we need to substitute a _[call reporting
number](https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US)_
instead when displaying to users via the external API. Values that look the same
but are subtly different across different APIs becomes very confusing.

## GraphQL to the rescue

What if we consolidated on GraphQL, and let all client types, regardless of
who or where they are in your application stack all fetch (mostly) the same data
from the same API? 😱

```graphql
type Business {
  id: ID!
  name: String!
  isOpen: Boolean!
  openingTime: String! @internalOnly
  closingTime: String! @internalOnly
  phoneNumber: String!
  phoneNumberRaw: String! @internalOnly
}
```

Throw everything in GraphQL -- both the external and internal-only fields.

To be clear:

- Private fields are kept private via the `@internalOnly` directive.
- Fields aren't executed unless requested in a query, so there's no performance
  penalty for including them all in the schema.
- Separation of concerns between private and external fields can be further
  enforced using _Schema Contracts_ — a common vendor feature* to ship different
  slices of the schema to different consumers. This could be applied here, to
  omit private-only field visibility entirely from the external schema.
  (<small>*[Apollo](https://www.apollographql.com/docs/graphos/platform/schema-management/delivery/contracts/overview), 
  [WunderGraph](https://cosmo-docs.wundergraph.com/concepts/schema-contracts), 
  [Hive](https://the-guild.dev/graphql/hive/docs/schema-registry/contracts)</small>)

Better yet, instead of `@internalOnly`, use an [`@auth`
directive](https://graphql.org/learn/authorization/#using-type-system-directives)
(or similar) to enforce granular RBAC or ABAC policies. (And better still,
define and derive these policies from [higher up in the
stack][auth-in-logic-layer]... which is the subject of different post 😅)

[auth-in-logic-layer]: https://graphql.org/learn/authorization/#type-and-field-authorization

### Should internal traffic go via the GraphQL Federation Router?

<details>

_(You may instead have many individual GraphQL services not connected to any
shared Router - that's fine too - and in which case, ignore this section!)_

This post talks a lot about Federation, so it’s worth clarifying one related
question: should internal service-to-service traffic also go through the Router?

In theory, probably **yes**...but perhaps only when it becomes worthwhile.

From a developer experience perspective, it would be more ideal than manually
making `n` individual network requests to `n` services. The cost however, is
added operational complexity: the touter becomes another single-point-of-failure
for internal service traffic, and may need to be be deployed and advertised
more locally to keep latency down.

That said, I think it’s still probably a good idea to use the router internally
for the following reasons:

- It’s easier to normalize differences between external and internal traffic
  centrally at the Router, rather than pushing that logic into every subgraph's
  middleware or individual resolvers.
- In cases where data is required from multiple services, callsites can write a
  single query against the supergraph -- instead of manually orchestrating
  multiple service calls and reimplementing router logic.
- If internal-only types are never queried through the Router, they may be
  orphaned and left out of the supergraph schema, which increases the risk of
  globally duplicated types and composition failures down the line.

- **Centralized normalization:** It’s easier to normalize differences between
  external and internal traffic centrally at the Router, rather than pushing that
  logic into every subgraph’s middleware or individual resolvers.
- **Unified queries:** In cases where data is required from multiple services,
  callsites can write a single query against the supergraph -- instead of
  manually orchestrating multiple service calls and reimplementing router logic.
- **Schema hygiene:** If internal-only types are never queried through the
  Router, they may be orphaned and left out of the supergraph schema, which
  increases the risk of globally duplicated types and composition failures down
  the line.

</details>

- **Centralized normalization:** It’s easier to normalize differences between
  external and internal traffic centrally at the Router, rather than pushing that
  logic into every subgraph’s middleware or individual resolvers.
- **Unified queries:** In cases where data is required from multiple services,
  callsites can write a single query against the supergraph -- instead of
  manually orchestrating multiple service calls and reimplementing router logic.
- **Schema hygiene:** If internal-only types are never queried through the
  Router, they may be
  orphaned and left out of the supergraph schema, which increases the risk of
  globally duplicated types and composition failures down the line.

Can easier leverage the existing schema breaking change detection features.

## Honorable mentions

I didn't have time to mention these in my talk, but I wanted to do mention some
other solutions in this space which may also fit your use case.

### Cosmo Connect + Apollo Connectors

The idea of "maintain a single API but expose it on multiple platforms" can also
be achieved by making the GraphQL layer on top of endpoints.

**[Cosmo Router's support for gRPC
Services](https://cosmo-docs.wundergraph.com/router/gRPC/grpc-services)** offers
a very compelling alternative if you're already in the gRPC ecosystem and wish
to only write and maintain gRPC endpoints. tl;dr you write `.graphql` schemas
that codegen to `.proto` files; the Federation router knows how to translate the
request and make native gRPC calls to your service.

Similarly, [Apollo
Connectors](https://www.apollographql.com/docs/graphos/connectors/requests)
provide native support to the Apollo Gateway for calling HTTP Services by
defining mappings via the `@connect` directive.

And for at GraphQLConf 2025, LinkedIn demonstrated their custom `.proto` ->
`.graphql` translation layer. In theory, this could be plugged into a
supergraph.

Although this isn't open sourced (as far as I can
tell), it's another interesting "reverse" approach to the above, and could in
theory be plugged into a router as a subgraph.

This is not a sponsored blog post; I haven't personally used any of these
options. But 

### Ent

### Entity Frameworks

https://cosmo-docs.wundergraph.com/router/gRPC/grpc-services

### Cap'n'web

https://github.com/cloudflare/capnweb

There are some intriguing language or vendor specific options such as [GraphQL->gRPC][wundergraph],
[gRPC->GraphQL][linkedin] and

[wundergraph]: https://cosmo-docs.wundergraph.com/router/gRPC/grpc-services
[linkedin]: https://www.youtube.com/watch?v=Orgyp3xOqwY

These are however language or vendor specific. T


## JSON is too inefficient!



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



