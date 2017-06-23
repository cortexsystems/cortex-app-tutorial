# Cortex Apps

The Cortex player provides a hardware agnostic environment for app developers. Cortex apps are  light-weight single page web applications built with a framework that follows Digital Out-Of-Home best practices. Unlike standard web applications, Cortex apps have access to the Cortex App API at runtime. Using this API, apps can access hardware resources or communicate to the Cortex backend.

In this tutorial we are going to build a simple app that displays several images in a loop. The final code lives in this repository under `src`.

## Application Package

Before diving into the details of how to build an app, let's go over the final package first. After writing the code, you are expected to build an app package and upload it to `Fleet`. App packages are simple zip files that expect at least the following files at the **top level**:

    .
    ├── index.html             # Main entry point for your app.
    ├── CHANGELOG.md           # Provides the change history of your app.
    ├── README.md              # Includes information about the app.
    ├── manifest.json          # Provides meta information about your application.
    
When an app is deployed to a player, the player will extract the zip file and simply run the `index.html` file in a browser-like environment. As long as you follow web standards, you are free to structure your app the way you want. However, the player enforces some restrictions to maintain a smooth on-screen experience.

    It is highly recommended that you keep CHANGELOG.md and README.md up to date as they will be very valuable
    for the users of your app once you make it available on Fleet.
    
`manifest.json` is a special file you need to include in the app package. Here is the manifest of this application:

```
{
  "name": "com.vistarmedia.apps.tutorial",
  "version": "1.0.0",
  "displayName": "Cortex App Tutorial",
  "description": "A step by step tutorial to start Cortex app development",
  "author": "Cortex",
  "email": "support@cortexpowered.com",
  "homepage": "http://vistarmedia.com",
  "type": "application",
  "assets": {
    "icon128": "",
    "icon256": "./app_assets/icon256.png",
    "icon512": "",
    "screenshot1": "./app_assets/screenshot1.jpeg",
    "screenshot2": "./app_assets/screenshot2.jpeg",
    "screenshot3": "./app_assets/screenshot3.jpeg",
    "screenshot4": "",
    "screenshot5": ""
  },
  "parameters": [
    {
      "name": "cortex.tutorial.duration",
      "default": "10000",
      "description": "The duration in milliseconds each image will stay on the screen"
    }
  ]
}
```

Cortex will use this file to extract information about your app. This information is used by Fleet as well as the player. You can refer to our knowledge base (contact Cortex support if you don't have access) to learn more about the manifest format. `name`, `version`, `assets` and `parameters` are the critical sections relevant to this tutorial:

- `name`: App names are unique identifiers. They are expected to follow the reverse domain name format. You can only use the domain names associated with your account. Cortex support can help you with your account setup.
- `version`: App version number. Cortex apps follow [semantic versioning](http://semver.org/) and app versions become immutable once they are uploaded to Fleet. In other words, you can't upload the same app name / version pair twice.
- `assets`: This section tells Fleet where to find app icons and screenshots. The icons and screenshots will be used within the Fleet app store once you upload your app. The values you provide need to resolve to real files otherwise Fleet will reject the app. For instance, in this app's manifest, all of the assets are stored under the `app_assets` folder at the root level of the zip file. That is why the manifest uses relative paths like `./app_assets/icon256.png`. You are free to store the assets anywhere in the zip file as long as the paths you provide are correct.
- `parameters`: This section declares configuration parameters for the app. Parameters are a convinient way of modifying the app behavior at runtime. You can change parameter values at the network and device level. Before starting your app, Cortex will compile and pass the final set of parameters to the app. For this application, we tell Cortex that this app uses a `cortex.tutorial.duration` parameter.

## Project Setup
This repository provides a good starting point to build Cortex apps. It uses some of the modern JavaScript development tools like `webpack` and `eslint`. Of course, you are free to set up the project the way you want to as long as the final compiled application follows the restrictions outlined in the previous section. This project structure transpiles ES6 code and copies the necessary files like `manifest.json` and `CHANGELOG.md` to the final app build folder. It can also build the final app zip package ready to be uploaded to Fleet.

Here is the directory structure of this project:

    .
    ├── html               # Contains index.html, will be included in the final pacakge
    ├── images             # Static images that will be displayed on screen
    ├── src                # App source code
    ├── .eslintrc.json
    ├── .gitignore
    ├── CHANGELOG.md       # Changelog, will be included in the final package
    ├── LICENSE
    ├── Makefile
    ├── README.md          # Readme, will be included in the final package
    ├── manifest.json      # App manifest, will be included in the final package
    ├── package.json
    ├── webpack.config.js

To build an app version:
```
$ npm install     # Installs dependencies
$ make build      # Transpiles the source code and puts everything under ./build
$ make pack       # Creates the final app package under ./dist
```

## Cortex App Lifecycle
Generally, the Cortex app lifecycle has three phases:

1. **Initialization**. At this stage, the app initializes itself using the runtime parameters.
2. **Content preparation**. Here, the app is expected to download any resources to the local disk and do any other offline work.
3. **Content rendering**. Finally, the content prepared in the previous step will be rendered and displayed on screen.

Once started, the player keeps the app running in the background indefinitely. Apps spend most of their time hidden in the background working on preparing content (e.g. parsing an RSS feed, downloading a video, etc.). Only occasionally will the player put the app in the third phase and make its output visible on screen.

It is important to keep the app as light as possible. The app should do the heavy lifting in the background and make sure it uses **only** offline content for rendering. For instance, if the app is supposed to play a video in the rendering phase, it should not enter the rendering phase until it fully downloads the video to local disk.

Another important point to keep in mind is that the apps don't have direct access to the screen. In other words, an app can't force the player to show itself on screen. Instead, the player asks the app to prepare content and then notifies the app when it's about to actually display it on screen. This indirect flow allows the player to control which app gets screen time and avoid any broken apps.

### Initialization
The player uses `index.html` to start an app. Let's take a look at the `./html/index.html` of this app:
``` html
...
  <body>
    <div id="container"></div>
    <script src="bundle.js"></script>
  </body>
...
```

`bundle.js` will be generated by `webpack` by transpiling the source code under `src`.

The entry point of this app is `./src/main.js`:

```javascript
import View from './view.js';

function main() {
  window.addEventListener('cortex-ready', function() {
    window.Cortex.app.getConfig().then(function(config) {
      const duration = Number(config['cortex.tutorial.duration']);
      console.info('Application will be initialized.', {duration: duration});

      const view = new View(duration);
      window.Cortex.scheduler.onPrepare((offer) => view.prepare(offer));
    }).catch(function(err) {
      console.error('Failed to initialize the application: ', err);
      throw err;
    });
  });
}

module.exports = main();
```

The first thing apps should do is to listen to the `cortex-ready` event. The player will fire this event when the app is fully loaded. The Cortex API will not be available before this event is received.
```javascript
window.addEventListener('cortex-ready', function() {
  // Use Cortex API
  // Access DOM and perform other actions.
});
```

Inside the `cortex-ready` handler, the first thing apps generally do is read the runtime config:

```javascript
window.Cortex.app.getConfig().then(function(config) {
  // Configure the app using the config object.
});
```

`window.Cortex.app.getConfig()` asks the player to return all of the configuration parameters. This API call returns a promise that resolves to an object. This object will have all parameters declared in the `manifest.json` as well as any other custom parameters set on Fleet.

`config` is a simple JavaScript object. You can access the parameters as:

```javascript
 const duration = Number(config['cortex.tutorial.duration']);
 ```
 
 Note that all of the values will be strings. It's the developer's responsibility to cast the values to the proper type.
 
 Finally, we initialize a `View` instance which handles all content preparation and rendering:
 ```javascript
const view = new View(duration);
window.Cortex.scheduler.onPrepare((offer) => view.prepare(offer));
```

`window.Cortex.scheduler.onPrepare()` is used to register a content preperation callback. The player will use this callback to ask the app to prepare a scene.

### Content Preparation
The Cortex player displays content on-screen in fixed time slots. It has a content display loop that runs indefinitely. The apps don't need to maintain a loop to generate and play content since the player handles the loop itself. Instead, apps register a callback for content preparation to the player. The player will regularly call this callback whenever it wants to show an app.

The main job of the app is to prepare some content when the player asks and later on render it on screen. At prepare time, the app is not visible on screen so it is safe to perform heavy functions like DOM modification, resource downloads, etc. The player will pass a callback to the prepare listener. The app can use this callback to let the player know whether it successfully prepared content or not. Here is the common flow of the prepare callback:

```javascript
class App {
  onPrepare(offer) {
    // App received a prepare() request from the player.
    // At this stage the app is still in the background. We can download content,
    // make DOM modifications, or perform any other resource intensive tasks.
    this.prepareSomeContent()
      .then((someView) => {
        // Content is ready. Let the player know about this:
        offer(someView);
      }).catch((err) => {
        // App failed to prepare content. Perhaps a download failed or some other
        // unexpected error occurred. Let the player know about this by calling offer
        // with no arguments. Player will move on to another app and make another prepare()
        // call to this app in future.
        offer();
      });
  }
}
```

In the above flow, whenever we receive the `prepare()` request, we start to work on the content with `prepareSomeContent()`. _It is **very important** for an app to use only offline content when visible on the screen_. Otherwise, the app might end up displaying partial content when it is visible on screen. Once all the content is stored on the disk, the app can generate the actual view function and pass it to the player. Here is the actual `prepare()` code of this app:

```javascript
prepare(offer) {
    if (this.index >= IMAGES.length) {
      this.index = 0;
    }

    const container = window.document.getElementById(CONTAINER_ID);

    const url = IMAGES[this.index];
    this.index += 1;

    this.createDOMNode(url).then((node) => {
      // Render the node.
    }).catch((e) => {
      console.error('Failed to create a DOM node.', {url: url, error: e});
      offer();
    });
  }
```

This app only uses static images we are shipping with the app package (see the `images/` directory).
We don't need to download content from a remote server. So the only preparation we do is to create the
DOM node for the next image to be displayed:

```javascript
  createDOMNode(url) {
    return new Promise((resolve, reject) => {
      const node = window.document.createElement('img');
      node.id = url;
      node.src = url;
      node.onload = () => {
        resolve(node);
      };
      node.onerror = reject;
    });
  }
```

`createDOMNode` takes a url and returns a promise that will resolve only when we successfully create an `<img>` node.
Note that we don't actually attach the newly created node to the DOM tree yet. Keep in mind that this app might already be
visible on screen displaying another image. If we attach the new image now, we will modify the screen and cut off the old
slot early. To avoid such problems it is strongly recommended to only modify DOM nodes when the player renders your view
function. In other words, on a `prepare()` call, we only create DOM notes and we attach them to the tree only in the view
function we pass to the `offer()`.

Another important point to note is that we rely on `onload` and `onerror` callbacks of the `<img>` node. This forces the
player to decode and load the image in memory, which further assures the content display will be smooth. In fact, if your
app is going to work on large images it is recommended to keep the nodes in memory for as long as possible. A common strategy
is to keep the `<img>` nodes attached to the DOM but use CSS attributes to hide them when they are not needed.

It is important for the `prepare()` calls to always return. For either a success or error, make sure you always call `offer()`. Otherwise, the player will keep waiting for a response, potentially affecting the health of your app.

### Content Rendering
From the player's perspective, each app is supposed to do one thing only, like displaying train times or weather information on the screen. With each `prepare()` call, the app gets a chance to submit a view to the player.
You can think of a view as a single page display. Views are essentially javascript functions that modify the DOM to display
something on screen. Once the DOM is modified, the view function will run for some time (slot duration) and then the player
will move on to the next view. The next view may or may not be from the same app.

View functions are structured as follows:

```javascript
function view(done) {
  makeDOMModifications();
  waitForSomeTime();
  done();
}
```

Right at the beginning, the view function makes DOM modifications like attaching an image node to the DOM. Then it waits
for some time. This duration is usually predefined by you. If you want an image to be displayed on screen for 15 seconds
you can simply use a timer to sleep for 15 seconds and then call the `done()` function to let the player know that the view
is completed. You can also use DOM events to fire the `done()` call. For instance, if you are playing a video file, you can
fire the `done()` callback when the video file finishes.

Here is the view function generated by this app:
```javascript
    // Redacted...
    this.createDOMNode(url).then((node) => {
      const view = (done) => {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        container.appendChild(node);
        window.setTimeout(done, this.duration);
      };

      offer(view, {label: url, ttl: 60 * 60 * 1000});
    }).catch((e) => {
      // Redacted...
    });
```

In this case, the view function starts by clearing the `container` first, to make sure we don't have any other images
from older runs. Then it attaches the newly created `<img>` node to the DOM:

```
container.appendChild(node);
```

At this stage the image will be visible on the screen. The only thing left for the view is to wait for some time.
We simply use the `setTimeout` function to call the `done()` after waiting for `this.duration` milliseconds.

Note that we generated this function after the `createDOMNode()` resolves. It is up to you to define the app flow,
you may create view functions beforehand as long as they don't rely on network resources.

When `createDOMNode()` resolves, the very last step is to pass the new view to the player. We use the `offer()` callback
to submit the view function to the player. You may pass some options to the `offer()` about the new view. The full list
of options can be found in the Cortex App API docs (contact support@ if you don't have access to the docs).

The entire `prepare()` and `offer()` flow is asynchronous. When you are generating the view function it is **not** guaranteed
that the view will be used by the player any time soon. If you want to display the current time make sure your view function
uses the latest time:

```javascript
// WRONG: now is the time we create the view.
now = new Date();
view(done) {
  displayTime(now);
}

// CORRECT: now is the time we display the view.
view(done) {
  now = new Date();
  displayTime(now);
}
```

## Deployment
Once your app is ready you can pack it and upload it to Fleet. To create an app package, run the following command on your
terminal:

```bash
make pack
```

This command will generate an app zip file under `./dist`. You can now upload it on Fleet and create a strategy for your player.
