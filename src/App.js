
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

  }
  generateSunSeries (timeRange) {
    const sunEvents = []
    const start = timeRange.toJSON()[0]
    const end = timeRange.toJSON()[1]
    for(let i = start; i <= end; i += 1*days) {
      const { sunrise, sunset } = calculateSunriseSunset(this.location, new Date(i))
      sunEvents.push([i,sunrise,sunset])
    }
    const sunSeries = new TimeSeries({ name: 'sunrises', columns: ["time","sunrise", "sunset"], points: sunEvents})
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

  render() {
    const style = styler([
      {key: 'sunset', color: "steelblue", width: 2}, 
      {key: 'sunrise', color: "goldenrod", width: 2}
    ])
    const hoverDate = this.state.tracker ? this.state.tracker : new Date()
    const index = this.state.sunSeries.bisect(hoverDate)
    const trackerEvent = this.state.sunSeries.at(index);
    const hoursOfDaylight = -1*(trackerEvent.get('sunrise') - trackerEvent.get('sunset'))
    const riseLabel = this.fractionalHoursToHoursMinutes(trackerEvent.get('sunrise'))
    const setLabel = this.fractionalHoursToHoursMinutes(trackerEvent.get('sunset')-12)
    return (
    <>
      <div>
        <h2>Date.....{hoverDate.getMonth() + 1}/{hoverDate.getDate()}/{hoverDate.getFullYear()}</h2>
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <h2 style={{ backgroundColor: 'goldenrod'}}>Sunrise..{riseLabel}AM</h2>
        <h2 style={{ backgroundColor: 'steelblue'}}>Sunset...{setLabel}PM</h2>
        </div>
      </div>
      <div style={{width: '100%'}}>
        <Resizable>
          <ChartContainer 
            trackerPosition={this.state.tracker} 
            trackerHintHeight={100}
            trackerHintWidth={100}
            onMouseMove={(x, y) => this.handleMouseMove(x, y)} 
            onTrackerChanged={this.handleTrackerChanged} 
            title={"Timeline"} 
            showGrid={true} 
            enablePanZoom={true} 
            timeRange={this.state.timeRange} 
            onTimeRangeChanged={this.handleTimeRangeChange}
            format={this.formatRelativeTicks}
          >
            <ChartRow height="400">
              <YAxis format={'.2s'} tickCount={25} showGrid={true} id="axis1" min={24} max={0} width="20" type="linear"/>
              <Charts>
                <LineChart info={[{label: 't', value: 2}]} axis="axis1" style={style} columns={["sunrise","sunset"]} series={this.state.sunSeries} />
                <Baseline axis="axis1" value={this.state.sunSeries.min('sunrise')} label="Earliest Sunrise" position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.max('sunrise')} label="Latest Sunrise" position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.min('sunset')} label="Earliest Sunset" position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.max('sunset')} label="Latest Sunset" position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.avg('sunrise')} label="Avg Sunrise" position="right"/>
                <Baseline axis="axis1" value={this.state.sunSeries.avg('sunset')} label="Avg Sunset" position="right"/>

                <TimeMarker axis="axis1" time={new Date()} label="today" infoStyle={{line: {strokeWidth: "2px", stroke: "black"}}} />
                {/* Need to have these calculate to match min and max daylight respectively */}
                <TimeMarker visible={this.state.markers.solstice} label="winter solstice" axis="axis1" time={new Date('2020/12/21 12:00:00')} infoStyle={{ line: { strokeWidth: "2px", stroke: 'blue' }}}/>
                <TimeMarker visible={this.state.markers.solstice} label="summer solstice" axis="axis1" time={new Date('2021/06/22 12:00:00')} infoStyle={{ line: { strokeWidth: "2px", stroke: 'orange' }}}/>
                {/* Need to have these calculate to match intersection with average */}
                <TimeMarker visible={this.state.markers.equinox} label="spring equinox" axis="axis1" time={new Date('2021/03/20 12:00:00')} infoStyle={{ line: {strokeWidth: "2px", stroke: "gold"}}} />
                <TimeMarker visible={this.state.markers.equinox} label="fall equinox" axis="axis1" time={new Date('2021/09/22 12:00:00')}  infoStyle={{ line: {strokeWidth: "2px", stroke: "gold"}}} />
                {/* Need to have these events plot on defintion: second sunday in march & first sunday in november; auto-repeat */}
                <TimeMarker visible={this.state.markers.DST} label="DST starts" axis="axis1" time={new Date('2021/03/14 01:00:00')} infoStyle={{ line: {strokeWidth: "2px", stroke: "pink"}}} />
                <TimeMarker visible={this.state.markers.DST} label="DST ends" axis="axis1" time={new Date('2020/11/01 02:00:00')} infoStyle={{ line: {strokeWidth: "2px", stroke: "lightblue"}}} />
                
              </Charts>
            </ChartRow>
				  </ChartContainer>
				</Resizable>
        <Legend type="line" align="right" style={style} categories={[
              {key: 'sunrise', label: 'sunrise', value: riseLabel},
              {key: 'sunset', label:'sunset', value: setLabel}
            ]}
        />
        </div>
          <div>
            Location: { `Lat: ${this.location.lat}, Long: ${this.location.lng}` }
            <br/>
            Today: { `${new Date().toDateString()}` }
            <br/>
            Delta: { `${this.formatRelativeTicks(this.state.tracker)}` }
            <br/>
            Hours of Daylight: { this.formatHours(hoursOfDaylight) }
            { Object.entries(this.state.markers).map(([name, value]) => 
              <div key={name}>
                <input 
                  type="checkbox" 
                  checked={value} 
                  onChange={() => this.setState((prev) => ({markers: {...prev.markers, [name]: !value}}))}
                />
                <label>{name}</label>
              </div>
            )}
          </div>
      </>
    );
  }
}

export default App;

