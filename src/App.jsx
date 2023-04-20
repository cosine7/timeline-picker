import { useCallback } from 'react'
import './App.scss'
import SideBar from './components/SideBar'
import TimelinePicker from './components/TimelinePicker'
import store from './store'
import { observer } from "mobx-react-lite"

export default observer(() => {
  const removeRange = useCallback(e => {
    if (e.target.tagName !== 'MAIN' || store.moving) {
      return
    }
    store.setRangeEnd(null)
    store.setRangeStart(null)
  }, [])

  return (
    <>
      <main onMouseUp={removeRange}>
        {new Array(2).fill(0).map((item, i) => <TimelinePicker key={i} ID={i} />)}
      </main>
      <SideBar />
    </>
  )
})