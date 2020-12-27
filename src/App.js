
import React from "react";
import tz from 'timezone';
import {TimeRange, TimeSeries } from 'pondjs'
import { Charts, ChartContainer, ChartRow, YAxis, LineChart } from 'react-timeseries-charts'

class App extends React.Component {
  constructor (props){
    super(props);
    const days = 24*60*60*1000
    const window = 115*days
    const defaultTimeRange = [Date.now()-window, Date.now()+window]
    this.location = {lat: 35.835, lng: -78.783 }
    this.calculateSunriseSunset = this.calculateSunriseSunset.bind(this)

    const sunEvents = []
    for(let i = defaultTimeRange[0]; i <= defaultTimeRange[1]; i += 1000 * 60 * 60 * 24) {
      const { sunrise, sunset } = this.calculateSunriseSunset(new Date(i))
      sunEvents.push([i,sunrise,sunset])
    }
    const sunSeries = new TimeSeries({ name: 'sunrises', columns: ["time","sunrise", "sunset"], points: sunEvents})
    this.state = { sunSeries, timeRange: defaultTimeRange }

  }
  calculateSunriseSunset (date) {
    const { lat, lng } = this.location
    const { sin, cos, tan,  acos, PI } = Math
    const degrees = PI / 180
    const radians = 180 / PI
    const dayOfYear = Number.parseInt(tz(date, "%j"))
    const hour = date.getHours()
    const timeOffset = date.getTimezoneOffset()
    
    const fracYear = 2*PI / 365 * (dayOfYear -1 + (hour - 12)/24)

    const equationOfTime = 229.18 * (7.5e-5 
                                  + 1.868e-3 * cos(fracYear) 
                                  - 3.2e-2 * sin(fracYear) 
                                  - 1.4615e-2 * cos(2*fracYear) 
                                  - 4.0849e-2 * sin(2*fracYear)
                                  )
    const declination = 6.918e-3 
                      - 3.99912e-1 * cos(fracYear) 
                      + 7.0257e-2 * sin(fracYear) 
                      - 6.758e-3 * cos(2*fracYear) 
                      + 9.07e-4 * sin(2*fracYear) 
                      - 2.697e-3 * cos(3*fracYear) 
                      + 1.48e-3 * sin(3*fracYear)
    const hourAngle = acos(
      cos(90.833*degrees) 
      / (cos(lat*degrees) * cos(declination)) 
      - (tan(lat*degrees) * tan(declination))
    )

    const sunrise = ((720 - 4 * (lng + hourAngle*radians) - equationOfTime) - timeOffset)/60
    const sunset = ((720 - 4 * (lng - hourAngle*radians) - equationOfTime) - timeOffset)/60

    return { sunrise, sunset }
  }
  

  render() {
    const style = {
      sunset: {
          line: {
              normal: {stroke: "steelblue", fill: "none", strokeWidth: 1},
              highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 1},
              selected: {stroke: "steelblue", fill: "none", strokeWidth: 1},
              muted: {stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 1}
          },
      },
      sunrise: {
          line: {
            normal: {stroke: "gold", fill: "none", strokeWidth: 1},
            highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 1},
            selected: {stroke: "gold", fill: "none", strokeWidth: 1},
            muted: {stroke: "gold", fill: "none", opacity: 0.4, strokeWidth: 1}
        },
      }
  };
    return (
      <>
        <div>
          <ChartContainer title={"Timeline"} showGrid={true} enablePanZoom={true} timeRange={new TimeRange(this.state.timeRange)} width={800}>
            <ChartRow height="200" enablePanZoom={true}>
              <YAxis id="axis1" label="hours" min={0} max={24} width="60" type="linear"/>
              <Charts>
                <LineChart axis="axis1" style={style} columns={["sunrise","sunset"]} series={this.state.sunSeries} />
              </Charts>
            </ChartRow>
          </ChartContainer>
        </div>
      </>
    );
  }
}

export default App;

