---
title: "The Case for Service-to-Service GraphQL"
pubDate: '2026-07-07T21:21:00.284Z'
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

In all cases above, the data we provide may ultimately be displayed to end
users. Therefore it needs to have the same business logic and auth checks
applied as your existing external API - otherwise we risk leaking private
information through the model and back out to the user. So from a safety
perspective alone, it would be nice to directly reuse the external GraphQL API
which already handles these concerns... on the server :)

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
an internal (REST) API might return for the same domain object:

<div class="side-by-side">
<div>

<p class="side-by-side-header"><strong>External GraphQL API</strong></p>

```graphql
type Business {
  name: String!
  phoneNumber: String!
  isOpen: Boolean!
}
```

</div>
<div>

<p class="side-by-side-header"><strong>Internal REST Service</strong></p>

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
businesses, we need to substitute a "[call reporting
number](https://biz.yelp.com/support-center/Advertising_on_Yelp/Yelp_Ads/What-is-Call-Reporting/en-US)"
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

Just throw everything in GraphQL -- both external and internal-only fields.
There's no penalty for doing so:

- Private fields can be kept private via an executable `@internalOnly` directive.
- Fields aren't fetched unless requested in a query, so there's no performance
  concern for including them all in the schema.

Better yet, use an [`@auth`
directive](https://graphql.org/learn/authorization/#using-type-system-directives)
(or similar) to enforce granular RBAC or ABAC policies rather than a simple
"public" vs "private" split.

(And better still, define and derive these policies from [higher up in the
stack][auth-in-logic-layer], which is possibly the subject of different post 😅)

[auth-in-logic-layer]: https://graphql.org/learn/authorization/#type-and-field-authorization

### Internal-only types

Some types will never be useful to be exposed via the external API. Services
often need to expose some raw representation of data that must always be
transformed into some other type before it's useful to any client.

That's fine! For example, consider the following two GraphQL services:

<div class="side-by-side">
<div>
<p class="side-by-side-header"><strong><code>products</code></strong></p>

```graphql
type Product {
  name: String!
  price: Float!
}
```
</div>

<div>
<p class="side-by-side-header"><strong><code>offer_codes</code></strong></p>

```graphql
type Coupon @internalOnly {
  code: String
  percentage: Int
}

type User {
  eligibleOffers: [Coupon] @internalOnly
}
```
</div>  

</div>

The `Product.price` resolver needs to call the `offer_codes` service in order to
apply a modifier to the price displayed to the user.

This implies a GraphQL query executed from inside a GraphQL query.
Weird, but fine. We're ok with REST-inside-GraphQL, why not
GraphQL-inside-GraphQL! Ideally the services/schemas could be restructured to
avoid extra roundtrips, but this isn't always possible, or worth the effort.

**Prior art:**
["re-entrancy"](https://viaduct.airbnb.tech/blog/2025/09/15/viaduct-five-years-on-modernizing-the-data-oriented-service-mesh
) is a first class feature of Viadict, Airbnb's GraphQL monolith.

Taking things a step further, you could also use "Schema Contracts", a common
vendor feature to omit such internal-only types entirely from the external
schema.
(<small>[Apollo](https://www.apollographql.com/docs/graphos/platform/schema-management/delivery/contracts/overview),
[WunderGraph](https://cosmo-docs.wundergraph.com/concepts/schema-contracts),
[Hive](https://the-guild.dev/graphql/hive/docs/schema-registry/contracts)</small>)

## Summary

With the rise of more folks "vibecoding" and the demand for quicker product
iteration in general, having a single, centralized, universally accessible
source of your company data has never been more valuable.

There is a cost to maintaining multiple APIs types which only increases with
the number of services, developers, API versions and client versions. GraphQL
can serve all client types, and is uniquely positioned to serve both public and
internal use cases particularly well.

GraphQL clients are widely already across many languages:

👉 <span class="highlight"><a href="https://graphql.org/community/tools-and-libraries/?tags=client">https://graphql.org/community/tools-and-libraries/?tags=client</a></span>

(If you don't find a suitable client for your language, please comment!)

Maintaining one thing is easier than maintaining multiple things. In short: 

> Want to keep your backend DRY? Consolidate on a GraphQL API!

## Appendix

<details>
<summary>Should internal traffic go via the GraphQL Federation Router?</summary>

You may instead have many individual GraphQL services not connected to any
shared Router - that's fine too - and in which case, ignore this section.

This post talks a lot about Federation, so it’s worth clarifying one related
question: should internal service-to-service traffic also go through the Router?

My answer would be **yes** for the following reasons:

- It’s easier to normalize differences between external and internal traffic
  centrally at the Router, rather than pushing that logic into every subgraph's
  middleware or individual resolvers.
- In cases where data comes from multiple services, callsites can write a
  single query against the supergraph -- instead of manually orchestrating
  multiple service calls (and reimplementing router logic!)
- If internal-only types are never queried through the Router, they may be
  orphaned and left out of the supergraph schema, which increases the risk of
  globally duplicated types and composition failures down the line.
- Easier to reuse and share tooling - e.g. breaking change detection based on
  supergraph schema changes.

The tradeoff is added operational complexity: the router becomes another
single-point-of-failure for internal service traffic, and may need to be be
deployed and advertised more locally to keep latency down.

If it seems silly and wasteful to introduce yet another proxy service for
service-to-service traffic (assuming you already have a service mesh) then you
could in theory hit the resolvers directly - and as a stepping stone, or where 
usage is very limited, this seems reasonable.
</details>

<details>
<summary>Honorable mentions</summary>

I didn't have time to mention these in my talk, but I wanted to mention some
other solutions in this space which may also fit your use case.

### Cosmo Connect + Apollo Connectors

The idea of "maintain a single API but expose it on multiple platforms" can also
be achieved by layering GraphQL on top of endpoints -- but with codegen, rather
than an old-timey manually created set of imperative mappings.

Cosmo Router supports calling [gRPC
Services](https://cosmo-docs.wundergraph.com/router/gRPC/grpc-services), which
offers a very compelling alternative if you're already in the gRPC ecosystem and
allows you to get the best of both worlds (gRPC + GraphQL). You write `.graphql`
schemas, which codegens into `.proto` files. The router translates inbound
GraphQL requests into upstream native gRPC calls to your service.

Similarly, [Apollo
Connectors](https://www.apollographql.com/docs/graphos/connectors/requests)
provides native support to the Apollo Gateway for calling HTTP Services by
defining mappings via the `@connect` directive.

And at GraphQLConf 2025, [LinkedIn
demonstrated](https://www.youtube.com/watch?v=Orgyp3xOqwY) their custom `.proto`
-> `.graphql` translation layer (which in theory I assume could also be plugged
into a supergraph).

I haven't personally used any of these offerings. But if you have the luxury of
starting from scratch, these options  likely offer the least amount of total
complexity.

### Entity Frameworks + Fancy ORMs

Internally, Meta uses "Ent Framework"
([source](https://www.youtube.com/watch?v=nKp_LUFk8EU)) behind GraphQL.
[ent](https://entgo.io/) is the open source recreation (I don't work at Meta,
but this is my understanding).

Some particularly compelling features that Ent offers:

- **Built in auth policies** -- at the ORM layer, not defined per-API
  ([docs](https://entgo.io/docs/privacy))
  - In addition, where possible, in-built database mechanisms such as
    PostgreSQL's Row Level Security can and should also be applied - but this is
    a separate topic!
- **Codegen** -- Ent can auto-generate equivalent GraphQL schemas and protobuf
  schemas + implementation
- **Hooks and interceptors** -- Can embed business logic rules inside the ORM to
  share between APIs

You do still have to manually implement the GraphQL resolvers, and some of the
per-API differences above still apply.

But if I were starting from scratch with a layered approach (in Go), Ent would
be a top contender.

</details>

<details>
<summary>JSON performance</summary>

> _"JSON is too inefficient to use for service-to-service!"_

If you're a hyperscale user (regularly transferring gigabytes of data or doing
high frequency trading) then fair - and I don't think this post applies to you
at all.

But if you're a "traditional" web application:

- inter-service payloads typically aren't (or shouldn't) be at the size where
  the cost of JSON parsing or serialization is noticeable
- compression works really well and is really fast
- even if you apply the "ah but 300 bytes saved across hundreds of thousands of
  QPS == $$$" logic, it still doesn't add up to very much

I'm going to hand-wave this topic away for now since I plan on following up with 
a blog post about this topic specifically. 

For more details though, I elaborated on this in [the
talk](https://graphqlconf2026.sched.com/event/2IPbF/service-to-service-graphql-the-new-sweet-spot-mark-larah-yelp),
and there's some numbers here provided by benjie:
https://github.com/graphql/graphql-spec/issues/432

...oh and also [Argo](https://github.com/msolomon/argo) is an alternative binary
protocol for GraphQL that is picking up steam -- [WhatsApp
presented](https://graphqlconf2026.sched.com/event/2IPch/an-alternative-to-json-responses-argo-in-whatsapp-kevin-gorham-meta)
about their usage of it.
</details>

<details>
<summary>Acknowledgments</summary>

Thanks to Benjie who reviewed my slides prior to GraphQLConf.

Thanks to Marc-Andre for inspiring the original talk with:
https://productionreadygraphql.com/blog/2020-05-14-sweetspot. I've referenced
this blog post many times internally, and I still think it's relevant, even with
this blog post. (The reframing being that services increasingly count as
non-trivial "clients" now too)
</details>
