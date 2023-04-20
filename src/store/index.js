import { makeAutoObservable } from 'mobx'

const hourRegex = /^([1-9]\d*|0)$/

class Store {
  startHour = 3
  endHour = 15
  rangeStart = null
  rangeEnd = null
  selected = -1
  moving = null

  constructor() {
    makeAutoObservable(this)
  }

  setStartHour = e => {
    const { value } = e.target
    if (!hourRegex.test(value)) {
      window.alert('Start Hour must be an integer greater or equal to 0')
      return
    }
    const start = Number(value)
    if (start >= this.endHour) {
      window.alert('Start Hour must less than End Hour')
      return
    }
    this.startHour = start

    if (this.rangeStart < start) {
      this.rangeStart = start
    }
  }

  setEndHour = e => {
    const { value } = e.target
    if (!hourRegex.test(value)) {
      window.alert('End Hour must be an integer greater or equal to 0')
      return
    }
    const end = Number(value)
    if (end <= this.startHour) {
      window.alert('End Hour must greater than Start Hour')
      return
    }
    this.endHour = end

    if (end < this.rangeEnd) {
      this.rangeEnd = end - 0.5
    }
  }

  setRangeStart = id => {
    this.rangeStart = id
  }

  setRangeEnd = id => {
    this.rangeEnd = id
  }

  setSelected = id => {
    this.selected = id
  }

  setMoving = id => {
    this.moving = id
  }

  setRange = (current, ID) => {
    const offset = current - this.moving
    const start = this.rangeStart + offset
    const end = this.rangeEnd + offset
    this.rangeStart = start < this.startHour ? this.startHour : start
    this.rangeEnd = end >= this.endHour ? this.endHour - 0.5 : end
    this.selected = ID
    this.moving = null
  }
}

export default new Store()