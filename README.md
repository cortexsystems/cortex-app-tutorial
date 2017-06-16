# Cortex Apps

Cortex player provides a hardware agnostic environment for app developers. Cortex apps are essentially light-weight single page web applications built with a framework that follows Digital Out-Of-Home best practices. Unlike standard web applications, Cortex apps have access to the Cortex App API at runtime. Using this API, apps can access hardware resources or communicate to the Cortex backend.

In this tutorial we are going to build a simple functioning app. The final code lives in this repository under `src`.

## Application Package

Before diving into the details of how to build an app, let's go over the final package first. After writing the code, you are expected to build an app package and upload it to `Fleet`. App packages are simple zip files that expects at least the following files at the **top level**:

    .
    ├── index.html             # Main entry point for your app.
    ├── CHANGELOG.md           # Provides the change history of your app.
    ├── README.md              # Includes information about the app.
    ├── manifest.json          # Provides meta information about your application.
    
When an app deployed to a player, the player will extract the zip file and simply run the `index.html` file on a browser-like environment. As long as you follow the web standards, you are free to structure your app the way you want. However, the player enforces some restrictions to make sure your app doesn't interrupt the overall on-screen experience.

    It is highly recommended to keep CHANGELOG.md and README.md up to date as they will be very valuable
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
- `assets`: This section tells Fleet where to find app icons and screenshots. The icons and screenshots will be used on Fleet app store once you upload your app. The values you provide needs to resolve to real files otherwise Fleet will reject the app. For instance, in this app's manifest, all of the assets are stored under the `app_assets` folder at the root level of the zip file. That is why the manifest uses the relative paths like `./app_assets/icon256.png`. You are free to store the assets anywhere in the zip file as long as the paths you provide are correct.
- `parameters`: This section declares configuration parameters for the app. Parameters is a convinient way of modifying the app behavior at runtime. You can change parameter values at network and player level. Before starting your app, Cortex will compile and pass the final set of parameters to the app. For this application, we tell Cortex that this app uses `cortex.tutorial.duration` parameter.

## Project Setup
This repository provides a good starting point to build Cortex apps. It uses some of the modern JavaScript development tools like `webpack` and `eslint`. Of course, you are free to set up the project the way you want as long as the final compiled application follows the restrictions outlined in the previous section. This project structure transpiles ES6 code and copies the necessary files like `manifest.json` and `CHANGELOG.md` to the final app build folder. It can also build the final app zip package ready to be uploaded to Fleet.

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
$ npm install     # Installes dependencies
$ make build      # Transpiles the source code and put everything under ./build
$ make pack       # Creates the final app package under ./dist
```

## Cortex App Lifecycle
Generally, Cortex apps can be broken down into three phases:

1. **Initialization**. At this stage, app initializes itself using the runtime parameters.
2. **Content preparation**. App is expected to download any resources to the local disk and do any other offline work.
3. **Content rendering**. Finally, the content prepared in the previous step will be rendered and displayed on screen.

Once started, the player keeps the app running in the background indefinitely. Apps spend most of their time hidden in the background working on preparing content (e.g. parse an RSS feed, download a video, etc.). Only occasionally the player will put the app in the third phase and make it's output visible on screen.

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

The first thing apps should do is to listen to the `cortex-ready` event. The player will fire this event when the app is fully loaded. Cortex API will not be available before this event is received.
```javascript
window.addEventListener('cortex-ready', function() {
  // Use Cortex API
  // Access DOM and perform other actions.
});
```

Inside the `cortex-ready` handler, the first thing apps generally do is to read the runtime config:

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
Cortex player displays content on screen in fixed time slots. It has a content display loop that runs indefinitely. Because the player handles the loop itself, the apps don't need to maintain a loop to generate and play content. Instead, it registers a callback for content preparation to the player. The player will regularly call this callback whenever it wants to show an app. 
