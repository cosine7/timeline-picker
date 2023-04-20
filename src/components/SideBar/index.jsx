import './index.scss'
import { observer } from "mobx-react-lite"
import store from '../../store'

export default observer(() => {
  return (
    <aside className='sidebar'>
      <div className="input-wrapper">
        <p>Start Hour</p>
        <input type="number" value={store.startHour} onChange={store.setStartHour}/>
      </div>
      <div className="input-wrapper">
        <p>End Hour</p>
        <input type="number" value={store.endHour} onChange={store.setEndHour} />
      </div>
    </aside>
  )
})