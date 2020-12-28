
import React from "react";
import tz from 'timezone';
import { TimeRange, TimeRangeEvent, TimeSeries } from 'pondjs'
import { 
  Charts, 
  ChartContainer, 
  ChartRow, 
  YAxis, 
  LineChart,
  TimeMarker, 
  styler,
  CrossHairs,
  Legend
} from 'react-timeseries-charts'

const days = 24*60*60*1000

class App extends React.Component {
  constructor (props){
    super(props);
    this.generateSunSeries = this.generateSunSeries.bind(this)
    this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this)
    this.handleTrackerChanged = this.handleTrackerChanged.bind(this)
    this.calculateSunriseSunset = this.calculateSunriseSunset.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)

    const window = 15*days
    const defaultTimeRange = [Date.now()-window, Date.now()+window]
    this.location = { lat: 35.835, lng: -78.783 }
    const sunSeries = this.generateSunSeries(new TimeRange(defaultTimeRange))
    this.state = { sunSeries, timeRange: new TimeRange(defaultTimeRange), x: null, y: null, tracker: null}

  }
  generateSunSeries (timeRange) {
    const sunEvents = []
    const start = timeRange.toJSON()[0]
    const end = timeRange.toJSON()[1]
    for(let i = start; i <= end; i += 1*days) {
      const { sunrise, sunset } = this.calculateSunriseSunset(new Date(i))
      sunEvents.push([i,sunrise,sunset])
    }
    const sunSeries = new TimeSeries({ name: 'sunrises', columns: ["time","sunrise", "sunset"], points: sunEvents})
    return sunSeries
  }
  handleTimeRangeChange(timeRange){
    const newSeries = this.generateSunSeries(timeRange)
    this.setState({ timeRange, sunSeries: newSeries })
  }
  handleTrackerChanged(tracker) {
    if (!tracker) {
        this.setState({ tracker, x: null, y: null });
    } else {
        this.setState({ tracker });
    }
  }
  handleMouseMove (x, y)  {
    this.setState({ x, y });
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
    const style = styler([
      {key: 'sunset', color: "steelblue", width: 2}, 
      {key: 'sunrise', color: "goldenrod", width: 2}
    ])
    return (
      <>
        <div>
          <ChartContainer trackerPosition={this.state.tracker} onMouseMove={(x, y) => this.handleMouseMove(x, y)} onTrackerChanged={this.handleTrackerChanged} title={"Timeline"} showGrid={true} enablePanZoom={true} timeRange={this.state.timeRange} width={800} onTimeRangeChanged={this.handleTimeRangeChange}>
            <ChartRow height="400">
              <YAxis format={'.2s'} tickCount={25} showGrid={true} id="axis1" label="hours" min={24} max={0} width="60" type="linear"/>
              <Charts>
                <LineChart info={[{label: 't', value: 2}]} axis="axis1" style={style} columns={["sunrise","sunset"]} series={this.state.sunSeries} />
                <TimeMarker axis="axis1" time={new Date()} infoStyle={{line: {strokeWidth: "2px", stroke: "#83C2FC"}}} />
              </Charts>
            </ChartRow>
          </ChartContainer>
          <Legend type="line" align="right" style={style} categories={[{key: 'sunrise', label: 'sunrise'},{key: 'sunset', label:'sunset'}]}/>
        </div>
      </>
    );
  }
}

export default App;

