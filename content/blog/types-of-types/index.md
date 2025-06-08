---
title: Types of types
date: '2024-10-08T12:00:00.284Z'
description: When and how to add an `.id` field on a GraphQL type
---

> _"To provide options for GraphQL clients to elegantly handle caching and data refetching, GraphQL servers need to expose object identifiers in a standardized way."_
> ~ [Global Object Identification Spec](https://graphql.org/learn/global-object-identification/)

This is an opinionated guide that enumerates the different "types of types" a GraphQL object type can be, and how to decide when and how to add an `.id` field.

---

In GraphQL, if a type is **stable** and can be refetched, we want it to have an `.id` field such that we can:

- cache it (both in clients and at the edge)
- set up a foreign key reference for use in [Federation](https://www.apollographql.com/docs/graphos/schema-design/federated-schemas/federation)

**Example**

```graphql
type Business {
    id: ID!
    name: String
    location: String
}
```

By "stable", we mean values that are <u>not</u> dynamically generated fresh on each query. `DiceRoll` would probably not make sense to cache. `Business` on the other hand would.

### Why standardize on `.id`?

As a quick motivation for why we go through this effort -- by standardizing that all cachable types in your schema have an `.id` field (rather than `.fooId` or `.uuid` or `.name`) we can:

- vastly simplify setting up the cache policies on clients
- not have to worry about keeping local cache id definitions "in sync" with the server
- not reimplement cache strategies on multiple platforms


## Types of types
Let’s list some "types of types" that we have in the schema, and how we'd specify an `.id` field for each type:

<!-- 
Value types
How to set `id`
Entities (mostly stable)
How to set `id`
FAQs
Piggyback Types
How to set `id`
Global Config Types
How to set `id`
Namespacer/Shell types
SDUI types
Types that should have an id field but don’t.
Value types
A type whose fields are all random, ephemeral or otherwise not fixed. For example: -->

### Value types

A type whose fields are all random, ephemeral or otherwise not fixed. For example:

- a current “state of the world” thing like the time or current rainfall
- ephemeral bag of values like a metrics data point
- the results of a machine learning model
- random bits of deeply nested UI
- totally randomly generated values per request

#### Examples

```graphql
"""Results of a player's dice roll in a game"""
type DiceRoll {
    value: Int
    thrownAt: Date
}
```

```graphql
"""What menu item our AI model thinks you will enjoy from the restaurant"""
type MenuRecommendation {
    foodDescription: String
    confidence: Float
}
```

**Value types should always be namespaced** into the product they’re intended to be used in. (Unless specifically designed to be shareable utility types, like DateTime),

Value types are good candidates to be @shareable in Federation. 
How to set `id`
Don’t. Such types do not make sense to cache and do not make sense to refer to via a foreign key, so do not have `.id` types.
Entities (mostly stable)
An “entity” is an object type that represents a thing that is stable, usually lives as a row in a database somewhere and usually has an encid (or some other db identifier).

Core types are mostly always entities (but not vice versa).

The fields on entity types are mostly usually stable.

Examples

type Business {
    name: String
    ...
}

type User {
    displayName: String
    ...
}

type ReviewDraft {
    body: String
    ...
}

How to set `id`
Such types should have .id fields, using the database row id (which is usually decid/encid at Yelp). Maybe it lives as a line in a yaml file - add a UUID so you can look up the object via the identifier.

Examples

For a simple type that has a direct encid:
const resolvers = {
    Business: {
        id: (parent) => generateNodeId("Business", parent.encid)
    }
};

For a thing that is declared as an object in a .yaml file in srv-configs - add a UUID (or use an existing ID) on the object and use that:

const resolvers = {
    PopupAdPricing: {
        id: (parent) => generateNodeId("PopupAdPricing", parent.uuid)
    }
};

FAQs
“What about any individual fields that are dynamically generated and would be immediately stale going into the cache?”
Hence the “mostly stable” bit.

Dynamic values should probably go and live in their own dedicated type that would be a child node on the parent entity type. The cache should be set up to only cache types that have .id fields (so any child nodes that have an .id should also be cached and “linked”)

(It’s possible we don’t always catch exceptions to this rule, and we should try and set this as a schema guideline)

“What about the fact that someone could update their username from the webapp, now the mobile cache value for that field is incorrect”
Hence the “mostly stable” bit.

I think this probably happens already? I don’t think there’s a good answer here beyond TTLs.

“What about encids?”
If the object has an encid directly, it’s recommended (but not strictly required) to add that on the type too as `Foo.encid`.

⚠️ (Don’t do this for piggyback types - i.e. don’t add BusinessMenu.encid where the encid is actually for the Business object. See below.)

“What about decids?”
Avoid adding decrypted id fields (i.e. the raw database row id) to the GraphQL Gateway schema in any way. Not even as an input (the client should never have it).

See: https://yelpwiki.yelpcorp.com/display/SEC/Don%27t+publicly+expose+decids

Piggyback Types
(I don’t know if a better name exists for this, so I’m inventing this here.)

These are types that are stable but only in the context of a parent type. i.e. they’re always fetched as child nodes on some parent type. There’s a 1:1 mapping. They don’t have encids of their own, but can always use their parent’s encid.

Examples
type Business {
  openingHours: BusinessOpenHours
}

type BusinessOpenHours {
    monday: [DateTime]
    tuesday: [DateTime]
    ...
}


type User {
  darkModePreferences: UserDarkModePreferences
}

type UserDarkModePreferences {
    prefersDarkMode: Boolean
    bgColor: String
}


In each case, these types only make sense when fetched in the context of “this is for a given business or user” etc. And there can only be one of each. A Business only ever has one BusinessOpenHours child node, a User only ever has one UserDarkModePreferences etc.

(If there were multiple options or variants for these things, like if a business starts offering multiple seasonal menus, then we need to be able to distinguish which BusinessMenu item we want. So we’d give them a row in a database each, give them encids of their own - then BusinessMenu becomes its own entity. Scroll up for guidance on entities.)
How to set `id`
Use the generateNodeId function, but use the parent’s encid (or uuid) as the second parameter We’re reusing and piggybacking off of the parent’s encid. 

To clarify, with the example of User & UserDarkModePreferences:

User has an encid. Its id is:
id = generateNodeId("User", parent.encid)

UserDarkModePreferences does not have an encid. But it has a 1:1 mapping with its parent User type, so it can reuse the User’s encid to form its id:
id = generateNodeId("UserDarkModePreferences", parent.userEncId)

User & UserDarkModePreference will have different id values, since generateNodeId is a hash function and takes in the type name as an argument.

Example
const resolvers = {
    UserDarkModePreferences: {
        id: (parent) => generateNodeId("UserDarkModePreferences", parent.userEncId)
    }
};

Global Config Types
These are types that are mostly stable and live as hardcoded values - e.g. vendor API keys, current holiday logo. These are site-wide and don’t change per user or business - they’re always the same values. Occccaaaaasionally they might get updated, but not often enough that we worry about stale cache values here.

Examples
type BugsnagConfig {
    apiKey: String
    ...
}

type WebFooterConfig {
    holidayLogoOverride: String
    copyrightYear: String
}


We still want these types to be cached, so even though these have no unique identifier, because there’s only ever one WebFooterConfig that is always the same, we can pretend and create an id type anyway so the client knows it can cache it.
How to set `id`
Since we don’t have an encid, just pass the empty string.

Example
const resolvers = {
    WebFooterConfig: {
        id: (parent) => generateNodeId("WebFooterConfig", "")
    }
};



Namespacer/Shell types
Types that exist to namespace other types. They tend not to carry data directly as attributes (i.e. no scalar types like String or Int)

Examples
"""
Information and features for Business owners
"""
type PrivateBizInfo {
    activityFeed: BizActivityFeed
    activeCampaigns: [AdCampaign]
    ...
}

extend type Business {
    private: PrivateBizInfo
}

""""
The root for all features available on admin.yelp.com
"""
type AdminSite {
    searchBusinessPhotos(query: String): [BusinessPhoto]
}

extend type Query {
    adminSite: AdminSite
}


These can be recategorized into one of the above definitions:

Is there a parent with an encid? If so, follow the guidance for “Piggyback Types”
e.g. PrivateBizInfo can piggyback off of the Business type

Is there only even 1 instance of this type? If so, follow the guidance for “Global Config Types”
e.g. AdminSite is the entrypoint for features on the admin site. It doesn’t change per user or per business, and we’re only ever going to construct one instance of this type in memory.

Everything else: Err on the side of caution and don’t add an .id field. (Follow the guidance for “Unstable types”.
SDUI types
??? unclear, we don’t officially support this in GGS yet.
Types that should have an id field but don’t.
Going forward, all new types should use the guidance outlined above. We (hope) to have covered all types of types above so you know when and how to add an id field.

We do have a bunch of them in the schema though, so you’ll encounter them a lot.

🛑  If there is any doubt about if your type should have an `.id` field, err on the side of caution and avoid giving it an `id` type. Cache poisoning is dangerous, and it's better to go back and add an `.id` field later as a performance optimization.


If you want to cache a type, but it doesn't have an id field then you either need custom client logic (yuck) or better - just add an id field (or ask a backend dev) using the above guidance. (Will always be a non-breaking change).
