# Timeline

A small React App that shows a zoomable, pan-able, linear calendar with sunrise, sunset, and moon cycles.

## Why?

I don't like traditional calendars -- they don't help me plan things effectively. 
When you look at a traditional calendar, the year is divided into arbitrary months with each month given its own sheet. 
That means I don't start thinking about the middle of the next month until the current month is over.
This is a disconnect with how I actually experience time -- not divided into arbitrary increments, but with one day following the other.
Therefore I set out to make a calendar that is more realistic.

## How 

This uses [React-timeseries-charts](https://software.es.net/react-timeseries-charts/#/guide/start) for the plotting.
For the sunrise/sunset data, I use the free [Sunrise-Sunset API](https://sunrise-sunset.org/api).


## Building and running on localhost

First install dependencies:

```sh
npm install
```

To run in hot module reloading mode:

```sh
npm start
```

To create a production build:

```sh
npm run build-prod
```

## Running

Open the file `dist/index.html` in your browser

## Credits

Made with [createapp.dev](https://createapp.dev/)

