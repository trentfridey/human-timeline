# Timeline

A small React App that shows a zoomable, pan-able, linear calendar with sunrise, sunset, and moon cycles.

## Why?

I don't like traditional calendars -- they don't help me plan things effectively. 
When you look at a traditional calendar, the year is divided into arbitrary months with each month given its own sheet. 
That means I don't start thinking about the middle of the next month until the current month is over.
This is a disconnect with how I actually experience time -- not divided into arbitrary increments, but with one day following the other.
Therefore I set out to make a calendar that is more realistic.

## How 

I used the calculations from [this NOAA PDF](https://www.esrl.noaa.gov/gmd/grad/solcalc/solareqns.PDF) to calculate the sunrise and sunsets for my (approximate) location.

This uses [React-timeseries-charts](https://software.es.net/react-timeseries-charts/#/guide/start) for the plotting.



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

