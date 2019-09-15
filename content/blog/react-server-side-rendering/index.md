---
title: React Server Side Rendering with Hypernova
date: '2015-05-01T22:12:03.284Z'
description: 'React Server Side Rendering with Hypernova'
---

_In this tutorial, we'll learn how to set up Server Side Rendering of React Components with [Hypernova](https://github.com/airbnb/hypernova)._

**Situation:** You've written a React app, and your website works great. Of course it does! But you begin to wonder, how can I improve performance on the client? The answer, of course, is [Server Side Rendering](https://facebook.github.io/react/docs/react-dom-server.html)!

![Actual footage of a user loading an SSR-enabled website for the first time.](https://media.tenor.co/images/8e9b53a9854d5333a923fca831064508/tenor.gif)
_Actual footage of a user loading an SSR-enabled website for the first time._

<span style="color: #999; font-size: 15px; text-align: center">Actual footage of a user loading an SSR-enabled website for the first time.</span>

Here are some great benefits to Server Side Rendering (SSR) your React components:

- Improved SEO Results [^1]
- No waiting for JavaScript to load on the client
- Works (sorta) for users with JavaScript disabled

There are a few projects that we could use to do SSR:

- https://github.com/redfin/react-server
- https://formidable.com/blog/2017/introducing-rapscallion/
- http://www.electrode.io/
- https://github.com/airbnb/hypernova

### Why?

Why not just use `ReactDOMServer.renderToString`? In a production environemnt, we also want to have things like caching, isolated rendering and multithreading in order to be able to scale.

The projects listed above allow us to solve these problems. They're all decent options, but we'll go with Hypernova here.

If you want to follow along, git clone [this repo](https://github.com/magicmark/ServerSideRenderingExample) for the example code.

### Setup

_([Scroll down](#servingthecomponents) if you want to skip the assumed setup.)_

Let's say you already have the existing following bare-bones code structure:

```bash
$ tree
.
├── .babelrc
├── .gitignore
├── assets
│   ├── index.html
│   └── jsx
│       ├── index.jsx
│       └── sheep.jsx
├── package.json
├── webpack.config.js
├── webserver.js
└── yarn.lock

2 directories, 9 files
```

Where `index.jsx` and `sheep.jsx` look like the following:

<script src="https://gist.github.com/magicmark/55599b44c94b7ad31b447a25afce1fea.js"></script>

`Sheep` is a "top-level" component, a component that gets loaded into the page with `ReactDOM.render`. Any components that are nested within `Sheep`, we don't care about - it's only these top level components that we'll be passing to the SSR server.

![](https://i.imgur.com/g2cTcza.jpg)
<span style="color: #999; font-size: 15px; text-align: center">(Sheep way prefer baaaackbone over React.)</span>

To complete the picture, we transpile with babel and use webpack to create a bundle that gets loaded into a template `index.html`.

<script src="https://gist.github.com/magicmark/f96f5d22f7ceb78c66d811c5da05aeed.js"></script>

Running `yarn start` runs webpack, spits out a build folder, launches a webserver and everything works as expected.

![beep beep](https://i.imgur.com/4k6bRV0.png)

This gives us a (very!) bare bones React app. We can now begin to add the SSR :)

_You can checkout the branch `stage-1` in the [example repo](https://github.com/magicmark/ServerSideRenderingExample/tree/stage-1) to get to this point._

### Setting up Server Side Rendering

Our website is in great shape, and now it's time to add SSR!

Instead of sending over a static compiled template that contains everything, we'll just keep the outer HTML structure in a template and let SSR components fill in the middle bits.

We'll do this in a few stages:

- Building a bundle for all our entrypoints
- Building a server to consume the bundle and serve the components
- Splitting up the `index.html` template to take in SSR components
- Refactoring our web server to serve the combined template + components

Eventually, our stack will look like this:
![](https://i.imgur.com/lP3aXs2.png)

### Building the entrypoints bundle

We will again use webpack to generate the bundle for the server side renderer. Here's what this process looks like:
![](https://i.imgur.com/t3IgvNX.png)

We will define a file, `components-entrypoint.jsx`, to import all the top-level components that we need. (Remember, a top-level component is defined by anything we'd otherwise call `ReactDOM.render` on. In our case, `Sheep`. For a new application, you'd probably only want one entrypoint.)

Here's what our `components-entrypoint.jsx` file looks like:

<script src="https://gist.github.com/magicmark/c62b4ae00e9f0bcfb99462feb8d48893.js"></script>

We now need to modify our webpack setup to generate an additional bundle for SSR, using our `components-entrypoint.jsx` file.

(You could place this in the existing `webpack.config.js` file and export an array of webpack configs, but we're going to make a new webpack config file to keep these two concerns seperate.)

Here is `webpack.ssr.config.js`:

<script src="https://gist.github.com/magicmark/6a2cff6c2fd11b4c424e2557df118d02.js"></script>

Running `yarn run build-ssr` spits out the compiled bundle.

_Checkout the branch `stage-2` in the [example repo](https://github.com/magicmark/ServerSideRenderingExample/tree/stage-2) to get to this point._

### Serving the components

Now that we've set up the bundling, let's create the Hypernova service to serve these components. Hypernova recommends doing this as a separate server:

> The recommended approach is running two separate servers, one that contains your server code and another that contains the Hypernova service. You‘ll need to deploy the JavaScript code to the server that contains the Hypernova service as well. [^2]

This is especially useful advice when deploying as part of a microservice architecture (having multiple concerns running in one containers is hairy [^3], and scaling becomes easier for a dedicated container). We'll "deploy" to a subdirectory in this tutorial, but we would ideally containerize each server individually, with only the compiled bundle needing to be shared.

In the directory `ssr`, let's create the following Hypernova server:

<script src="https://gist.github.com/magicmark/46d4cf41d8dc6f338428890801a309e3.js"></script>

We can verify the server works by running the server with `yarn run start-ssr` and querying the API for our `Sheep` component:

```
$ curl -X POST localhost:8080/batch \
  -H Content-Type:application/json \
  -d '{"mysheep": {"name":"Sheep", "data": {}}}' | jq
{
  "success": true,
  "error": null,
  "results": {
    "mysheep": {
      "name": "Sheep",
      "html": "<div data-hypernova-key=\"Sheep\" data-hypernova-id=\"684d437b-dda0-4695-9e68-b544c5b98b97\"><div data-reactroot=\"\" data-reactid=\"1\" data-react-checksum=\"255991580\"><p data-reactid=\"2\">beep beep I&#x27;m a sheep</p></div></div>\n<script type=\"application/json\" data-hypernova-key=\"Sheep\" data-hypernova-id=\"684d437b-dda0-4695-9e68-b544c5b98b97\"><!--{}--></script>",
      "meta": {},
      "duration": 1.262021,
      "statusCode": 200,
      "success": true,
      "error": null
    }
  }
}
```

_Checkout the branch `stage-3` in the [example repo](https://github.com/magicmark/ServerSideRenderingExample/tree/stage-3) to get to this point._

### Updating index.html

Let's turn `index.html` into a function that accepts some markup:

<script src="https://gist.github.com/magicmark/75177ecdf89eec6e4cc1709a11c6ebd8.js"></script>

This enables us to get the markup from Hypernova and pass it down as an argument. (In the real world where markup probably already lives in templates, this may not be easily doable. This will be discussed further in a future blog post, but the answer for now is [string substitution](https://github.com/airbnb/hypernova-ruby/blob/04d7260/lib/hypernova.rb#L38).)

_Checkout the branch `stage-4` in the [example repo](https://github.com/magicmark/ServerSideRenderingExample/tree/stage-4) to get to this point._

### Combining it all

Finally! Now we can call Hypernova from our webserver and plug the rendered React markup into our template.

<script src="https://gist.github.com/magicmark/b0129e5dd3e0327ffafafc2dc88ba315.js"></script>

We also need to update `index.jsx` to let Hypernova hook into the rendered components instead of using `ReactDOM.render`

<script src="https://gist.github.com/magicmark/4db35f601ce630b06f7d4bbbc62bec74.js"></script>

Fingers crossed - let's run `yarn start` to compile webpack, launch Hypernova and start the webserver and hopefully...

![](https://i.imgur.com/oH7JeTQ.png)

Hooray! It's exactly the same, but _slightly quicker_!

![](https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif)

Stay tuned for performance tweaks and optimizations!

_Checkout the [example repo](https://github.com/magicmark/ServerSideRenderingExample) for all the code._

### References

[^1]: http://andrewhfarmer.com/react-seo/
[^2]: https://github.com/airbnb/hypernova#deploying
[^3]: https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/#each-container-should-have-only-one-concern
