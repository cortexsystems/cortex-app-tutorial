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
