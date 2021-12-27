
import React from "react";
import { calculateSunriseSunset } from './util/calcSun' 
import { TimeRange, Time, TimeSeries } from 'pondjs'
import { 
	Resizable,
	Charts, 
  ChartContainer, 
  ChartRow, 
  YAxis, 
  LineChart,
  TimeMarker, 
  styler,
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
    this.onObtainLocation = this.onObtainLocation.bind(this)
    this.handleNav = this.handleNav.bind(this)
    
    const window = 240*days
    const defaultTimeRange = [Date.now()-window/2, Date.now()+3*window/2]
    const initialLocation = { lat: 35.835, lng: -78.783 }
    const sunSeries = this.generateSunSeries(initialLocation, new TimeRange(defaultTimeRange))
    
    this.state = { 
      sunSeries: sunSeries, 
      solstice: { summer: 0, winter: 0 },
      equinox: [],
      sunrise: { max: 0, min: 0},
      sunset: { max: 0, min: 0},
      timeRange: new TimeRange(defaultTimeRange), 
      x: null, 
      y: null, 
      tracker: null,
      location: initialLocation,
      markers: {
        solstice: true,
        equinox: true,
        DST: true
      }
    }
    this.getSolstice()
    this.getEquinox()
  }
  componentDidMount () {
    navigator.geolocation.getCurrentPosition(this.onObtainLocation, console.log, {enableHighAccuracy: true})
  }
  onObtainLocation ({ coords }){
    const location = { lat: coords.latitude, lng: coords.longitude}
    const sunSeries = this.generateSunSeries(location, this.state.timeRange)
    this.setState({ sunSeries, location })
    this.getSolstice()
    this.getEquinox()
  }
  generateSunSeries (location, timeRange) {
    const sunEvents = []
    const start = timeRange.toJSON()[0]
    const end = timeRange.toJSON()[1]
    for(let i = start; i <= end; i += 1*days) {
      const { sunrise, sunset } = calculateSunriseSunset(location, new Date(i))
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
  handleNav(delta) {
    const date = this.state.tracker ? this.state.tracker : new Date()
    const currentDay =  date.getDate()
    const currentDate = [date.getFullYear(), date.getMonth()]
    let nextDate = new Date(...currentDate, currentDay+delta ) 
    this.setState({ tracker: nextDate }) 
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
      if(Math.abs(hoursOfSun - 12) < 0.02) this.state.equinox = [evt.begin(), ...this.state.equinox]
    }
  }

  render() {
    const style = styler([
      {key: 'sunset', color: "steelblue", width: 5}, 
      {key: 'midday', color: 'orange', width: 5},
      {key: 'sunrise', color: "gold", width: 5}
    ])
    const now = new Date()
    const hoverDate = this.state.tracker ? this.state.tracker : now
    const index = this.state.sunSeries.bisect(hoverDate)
    const trackerEvent = this.state.sunSeries.at(index);
    const sunrise = trackerEvent.get('sunrise');
    const midday = trackerEvent.get('midday');
    const sunset = trackerEvent.get('sunset');
    const hoursOfDaylight = (sunset - sunrise);
    const nowHours = now.getHours() + now.getMinutes()/60 + now.getSeconds()/(60*60)
    const remainingHours = sunset > nowHours ? sunset - nowHours : 0
    const riseLabel = this.fractionalHoursToHoursMinutes(sunrise)
    const middayLabel = this.fractionalHoursToHoursMinutes(midday)
    const setLabel = this.fractionalHoursToHoursMinutes(sunset-12)
    const baselineStyle = {
      line: {
          stroke: "black",
          strokeWidth: 2,
          opacity: 1,
          strokeDasharray: "none"
      }
    };
    const h2Style = { padding: 10, margin: 'none', textAlign: 'center'}
    const buttonStyle = { 
      fontWeight: 'bold', 
      fontSize: '20px',
      padding: 20, 
      flex: '1 0 auto', 
      textAlign: 'left', 
      cursor: 'pointer',
      border: 'none'
    }
    return (
    <>
      <div style={{ textAlign: 'center', fontSize: '45px'}}>
        🌞
      </div>
      <div>
        <h2 style={{ ...h2Style, backgroundColor: 'white', border: '5px solid black' }}>Date....{hoverDate.getMonth() + 1}/{hoverDate.getDate()}/{hoverDate.getFullYear()}</h2>
        <h2 style={{ ...h2Style, backgroundColor: 'gold' }}>Sunrise...{riseLabel}AM</h2>
        <h2 style={{ ...h2Style, backgroundColor: 'orange'}}>Midday......{middayLabel}</h2>
        <h2 style={{ ...h2Style, backgroundColor: 'steelblue', color: "white"}}>Sunset....{setLabel}PM</h2>
        <h2 style={{ ...h2Style, border: '5px solid black' }} >Daylight Hours: { this.formatHours(hoursOfDaylight) }</h2>
        <h2 style={{ ...h2Style, border: '5px solid black', borderTop: 'none' }} >Remaining Hours: {this.formatHours(remainingHours)}</h2>
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
                
                <Baseline axis="axis1" value={nowHours} style={baselineStyle}/>
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
              </Charts>
            </ChartRow>
				  </ChartContainer>
				</Resizable>
        </div>
          <div style={{ fontFamily: 'monospace'}}>
          <div style={{display: 'flex'}}>
            <button onClick={()=>this.handleNav(-1)} style={{ ...buttonStyle,  backgroundColor: 'steelblue',  borderBottom: '5px solid blue'  }} >
            { '< Yesterday' }
            </button>
            <button onClick={()=>this.handleNav(1)} style={{ ...buttonStyle, backgroundColor: 'gold',  textAlign: 'right', borderBottom: '5px solid orange' }} >
              { 'Tomorrow  >' }
            </button>
          </div>
            Location: { `Lat: ${this.state.location.lat}, Long: ${this.state.location.lng}` }
            <br/>
          </div>

      </>
    );
  }
}

export default App;

