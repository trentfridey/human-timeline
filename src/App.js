
import React from "react";
import { calculateSunriseSunset } from './util/calcSun' 
import { TimeRange, TimeRangeEvent, TimeSeries } from 'pondjs'
import { 
	Resizable,
	Charts, 
  ChartContainer, 
  ChartRow, 
  YAxis, 
  LineChart,
  TimeMarker, 
  styler,
  CrossHairs,
  Legend,
  Baseline,
} from 'react-timeseries-charts'

const seconds = 1000
const minutes = 60*seconds
const hours = 60*minutes
const days = 24*hours

class App extends React.Component {
  constructor (props){
    super(props);
    this.generateSunSeries = this.generateSunSeries.bind(this)
    this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this)
    this.handleTrackerChanged = this.handleTrackerChanged.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)

    const window = 240*days
    const defaultTimeRange = [Date.now()-window/2, Date.now()+3*window/2]
    this.location = { lat: 35.835, lng: -78.783 }
    const sunSeries = this.generateSunSeries(new TimeRange(defaultTimeRange))
    
    this.state = { 
      sunSeries, 
      solstice: { summer: 0, winter: 0 },
      equinox: [],
      sunrise: { max: 0, min: 0},
      sunset: { max: 0, min: 0},
      timeRange: new TimeRange(defaultTimeRange), 
      x: null, 
      y: null, 
      tracker: null,
      markers: {
        solstice: true,
        equinox: true,
        DST: true
      }
    }
    this.getSolstice()
    this.getEquinox()
  }
  generateSunSeries (timeRange) {
    const sunEvents = []
    const start = timeRange.toJSON()[0]
    const end = timeRange.toJSON()[1]
    for(let i = start; i <= end; i += 1*days) {
      const { sunrise, sunset } = calculateSunriseSunset(this.location, new Date(i))
      const hoursOfSun = sunset - sunrise
      const midday = sunrise + (hoursOfSun) / 2
      sunEvents.push([i, sunrise, midday, sunset, hoursOfSun])
    }
    const sunSeries = new TimeSeries({ 
      name: 'sunrises', 
      columns: ["time","sunrise", 'midday', "sunset", 'hoursOfSun'], 
      points: sunEvents})
    return sunSeries
  }
  handleTimeRangeChange(timeRange){
    this.setState({ timeRange })
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
  formatRelativeTicks (d) {
    if(!d) return 'None'
    const delta = (d - Date.now())
    return `${Math.floor(delta/days)} d` 
  }
  formatHours (hours) {
    if(!hours) return '--'
    const roundedMinutes = Math.floor(hours*60)
    const wholeHours = (roundedMinutes - roundedMinutes % 60)/60
    return `${wholeHours}hrs ${Math.floor(hours *60) % 60}min`
  }
  fractionalHoursToHoursMinutes (hours) {
    const totalMinutes = Math.floor(hours * 60)
    const minutes = totalMinutes % 60
    const wholeHours = (totalMinutes - minutes) / 60
    return `${wholeHours < 10 ? '0'+wholeHours : wholeHours}:${minutes < 10 ? '0'+minutes : minutes}`
  }
  getSolstice() {
    const [maxSunrise, minSunrise, maxSunset, minSunset, summerSol, winterSol] = [
      this.state.sunSeries.max('sunrise'),
      this.state.sunSeries.min('sunrise'),
      this.state.sunSeries.max('sunset'),
      this.state.sunSeries.min('sunset'),
      this.state.sunSeries.max('hoursOfSun'),
      this.state.sunSeries.min('hoursOfSun')
    ]
    for(const evt of this.state.sunSeries.events()){
      const [sunrise, sunset, hoursOfSun] = [
        evt.get('sunrise'),
        evt.get('sunset'),
        evt.get('hoursOfSun')
      ]
      if(hoursOfSun === summerSol) this.state.solstice.summer = evt.begin()
      if(hoursOfSun === winterSol) this.state.solstice.winter = evt.begin()
      if(sunrise === maxSunrise) this.state.sunrise.max = evt.begin()
      if(sunrise === minSunrise) this.state.sunrise.min = evt.begin()
      if(sunset === maxSunset)   this.state.sunset.max =  evt.begin()
      if(sunset === minSunset)   this.state.sunset.min =  evt.begin()
    }
  }
  getEquinox () {
    for(const evt of this.state.sunSeries.events()){
      const hoursOfSun = evt.get('hoursOfSun')
      if(Math.abs(hoursOfSun - 12) < 0.01) this.state.equinox = [evt.begin(), ...this.state.equinox]
    }
    console.log(this.state.equinox)
  }

  render() {
    const style = styler([
      {key: 'sunset', color: "steelblue", width: 5}, 
      {key: 'midday', color: 'orange', width: 5},
      {key: 'sunrise', color: "gold", width: 5}
    ])
    const hoverDate = this.state.tracker ? this.state.tracker : new Date()
    const index = this.state.sunSeries.bisect(hoverDate)
    const trackerEvent = this.state.sunSeries.at(index);
    const sunrise = trackerEvent.get('sunrise');
    const midday = trackerEvent.get('midday');
    const sunset = trackerEvent.get('sunset');
    const hoursOfDaylight = (sunset - sunrise)
    const riseLabel = this.fractionalHoursToHoursMinutes(sunrise)
    const middayLabel = this.fractionalHoursToHoursMinutes(midday)
    const setLabel = this.fractionalHoursToHoursMinutes(sunset-12)
    return (
    <>
      <div style={{ textAlign: 'center', fontSize: '45px'}}>
        🌞
      </div>
      <div>
        <h2 style={{ textAlign: 'center', backgroundColor: 'white', padding: 10, border: '5px solid black' }}>Date....{hoverDate.getMonth() + 1}/{hoverDate.getDate()}/{hoverDate.getFullYear()}</h2>
        <h2 style={{ textAlign: 'center', backgroundColor: 'gold', margin: 'none', padding: 10}}>Sunrise...{riseLabel}AM</h2>
        <h2 style={{ textAlign: 'center', backgroundColor: 'orange', margin: 'none', padding: 10}}>Midday......{middayLabel}</h2>
        <h2 style={{ textAlign: 'center', backgroundColor: 'steelblue', margin: 'none', padding: 10, color: "white"}}>Sunset....{setLabel}PM</h2>
        <div style={{ fontFamily: 'monospace', textAlign: 'right' }}>Hours of Daylight: { this.formatHours(hoursOfDaylight) }</div>
      </div>
      <div style={{width: '100%', border: '1px solid black', overflow: 'hidden'}}>
        <Resizable>
          <ChartContainer 
            trackerPosition={this.state.tracker} 
            trackerHintHeight={100}
            trackerHintWidth={100}
            onMouseMove={(x, y) => this.handleMouseMove(x, y)} 
            onTrackerChanged={this.handleTrackerChanged} 
            showGrid={true} 
            timeRange={this.state.timeRange} 
            onTimeRangeChanged={this.handleTimeRangeChange}
            format={this.formatRelativeTicks}
          >
            <ChartRow height="400">
              <YAxis format={'.2s'} tickCount={25} showGrid={true} id="axis1" min={24} max={0} width="20" type="linear"/>
              <Charts>
                <LineChart info={[{label: 't', value: 2}]} axis="axis1" style={style} columns={["sunrise",'midday',"sunset"]} series={this.state.sunSeries} />
                <Baseline axis="axis1" value={this.state.sunSeries.min('sunrise')}  position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.max('sunrise')}  position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.min('sunset')}   position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.max('sunset')}   position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.avg('sunrise')}  position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.avg('sunset')}   position="right"/>

                <TimeMarker axis="axis1" time={new Date()} label="today" infoStyle={{line: {strokeWidth: "2px", stroke: "black"}}} />

                <TimeMarker axis="axis1" time={this.state.sunrise.max} infoStyle={{ line: { strokeWidth: "2px", stroke: 'gold' }}}/>
                <TimeMarker axis="axis1" time={this.state.sunrise.min} infoStyle={{ line: { strokeWidth: "2px", stroke: 'gold' }}}/>
                <TimeMarker axis="axis1" time={this.state.sunset.max} infoStyle={{ line: { strokeWidth: "2px", stroke: 'steelblue' }}}/>
                <TimeMarker axis="axis1" time={this.state.sunset.min} infoStyle={{ line: { strokeWidth: "2px", stroke: 'steelblue' }}}/>

                <TimeMarker axis="axis1" time={this.state.solstice.summer} infoStyle={{ line: { strokeWidth: "2px", stroke: 'orange' }}} />
                <TimeMarker axis="axis1" time={this.state.solstice.winter} infoStyle={{ line: { strokeWidth: "2px", stroke: 'orange' }}} />

                {this.state.equinox.map(e => {
                  return <TimeMarker axis='axis1' time={e} infoStyle={{line: { strokeWidth: "2px", stroke: 'grey' }}} />
                })}

                {/* Need to have these events plot on defintion: second sunday in march & first sunday in november; auto-repeat */}
                <TimeMarker label="DST starts" axis="axis1" time={new Date('2021/03/14 01:00:00')} infoStyle={{ line: {strokeWidth: "2px", stroke: "pink"}}} />
                <TimeMarker label="DST ends" axis="axis1" time={new Date('2020/11/01 02:00:00')} infoStyle={{ line: {strokeWidth: "2px", stroke: "lightblue"}}} />
                
              </Charts>
            </ChartRow>
				  </ChartContainer>
				</Resizable>
        </div>
          <div style={{ fontFamily: 'monospace'}}>
            Location: { `Lat: ${this.location.lat}, Long: ${this.location.lng}` }
            <br/>
            Today: { `${new Date().toDateString()}` }
            <br/>
            Delta: { `${this.formatRelativeTicks(this.state.tracker)}` }
            <br/>
          </div>

      </>
    );
  }
}

export default App;

