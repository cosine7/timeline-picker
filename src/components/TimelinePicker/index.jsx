import './index.scss'
import { observer } from "mobx-react-lite"
import store from '../../store'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const classes = items => {
  const result = []
  Object.entries(items).forEach(([key, value]) => {
    if (value) {
      result.push(key)
    }
  })
  return result.join(' ')
}

const debounce = (fn, time) => {
  let timer = null

  return (...args) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.call(undefined, ...args)
    }, time)
  }
}

export default observer(({ ID }) => {
  const [dragging, setDragging] = useState()
  const [movingPosition, setMovingPosition] = useState()
  const [force, forceUpdate] = useState({})
  const container = useRef()

  const onClickCell = useCallback(id => e => {
    if (e.target.classList.contains('selected')) {
      return
    }
    store.setRangeStart(id)
    store.setRangeEnd(id)
    store.setSelected(ID)
  }, [])

  useLayoutEffect(() => {
    const update = debounce(() => {
      forceUpdate([])
    }, 500)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const maxColumn = useMemo(() => {
    if (!container.current) {
      return 0
    }
    const containerRect = container.current.getBoundingClientRect()
    return Math.floor((containerRect.width - 100) / 100) * 2 + 1
  }, [container.current, force])

  const onDragRight = useCallback(e => {
    e.stopPropagation()
    if (store.moving) {
      return
    }
    const targetRect = e.target.getBoundingClientRect()
    const containerRect = container.current.getBoundingClientRect()
    const row = Math.floor((targetRect.top - containerRect.top) / 100)
    const column = Math.floor((targetRect.left - containerRect.left) / 50 + 1)

    const maxRow = containerRect.height / 100
    // const maxColumn = Math.floor((containerRect.width - 50) / 100) * 2 + 1
    const maxLeft = maxColumn * 50
    const maxLeftLastRow = ((store.endHour - store.startHour) * 2 - (maxRow - 1) * maxColumn + maxRow) * 50

    const startRow = Math.floor((store.rangeStart - store.startHour) * 2 / (maxColumn - 1))
    const startColumn = (store.rangeStart - store.startHour) * 2 % (maxColumn - 1) + 2

    const currentTop = row * 100
    const currentLeft = column * 50
    const currentX = e.clientX

    const startTop = startRow * 100
    const startLeft = startColumn * 50

    const onMouseMove = e => {
      let top
      let left = currentLeft + e.clientX - currentX
      let r = Math.floor((e.clientY - containerRect.y) / 100)

      if (left < 50) {
        left = 50
      } else if (left > maxLeft) {
        left = maxLeft
      }

      if (r < startRow) {
        top = startTop
        r = startRow
      } else if (r >= maxRow) {
        top = containerRect.height - 100
        r = maxRow - 1
      } else {
        top = r * 100
      }

      if (r === startRow && left < startLeft) {
        left = startLeft
      }
      if (r === maxRow - 1 && left > maxLeftLastRow) {
        left = maxLeftLastRow
      }
      
      setDragging({ top, left })
    }

    const onMouseUp = e => {
      e.stopPropagation()
      setDragging(null)
      document.removeEventListener('mousemove', onMouseMove)
      const parts = container.current.children
      const lineRect = parts[0].getBoundingClientRect()

      for (let i = parts.length - 1; i > 0; i--) {
        const part = parts[i]
        for (let j = part.children.length - 1; j >= 0; j--) {
          const el = part.children[j]

          if (el.tagName !== 'DIV') {
            continue
          }
          const elRect = el.getBoundingClientRect()
          
          if (lineRect.top > elRect.bottom
            || (lineRect.right - 4) < elRect.left
            || lineRect.bottom < elRect.top
            || (lineRect.left - 4) > elRect.right) {
            continue
          }
          store.setRangeEnd(Number(el.dataset.id))
          return
        }
      }
    }
    setDragging({ top: currentTop, left: currentLeft })
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp, { once: true })
  }, [store.startHour, store.endHour, container, store.rangeStart, store.moving])

  const onDragLeft = useCallback(e => {
    e.stopPropagation()
    if (store.moving) {
      return
    }
    const targetRect = e.target.getBoundingClientRect()
    const containerRect = container.current.getBoundingClientRect()
    const row = Math.floor((targetRect.top - containerRect.top) / 100)
    const column = Math.floor((targetRect.left - containerRect.left) / 50 + 1)

    // const maxColumn = Math.floor((containerRect.width - 50) / 100) * 2 + 1
    const maxLeft = maxColumn * 50

    const endRow = Math.floor((store.rangeEnd - store.startHour) * 2 / (maxColumn - 1))
    const endColumn = (store.rangeEnd - store.startHour) * 2 % (maxColumn - 1) + 1

    const currentTop = row * 100
    const currentLeft = column * 50
    const currentX = e.clientX

    const endTop = endRow * 100
    const endLeft = endColumn * 50

    const onMouseMove = e => {
      let top
      let left = currentLeft + e.clientX - currentX
      let r = Math.floor((e.clientY - containerRect.y) / 100)

      if (left < 50) {
        left = 50
      } else if (left > maxLeft) {
        left = maxLeft
      }

      if (r > endRow) {
        top = endTop
        r = endRow
      } else if (r < 0) {
        top = 0
        r = 0
      } else {
        top = r * 100
      }

      if (r === endRow && left > endLeft) {
        left = endLeft
      }
      setDragging({ top, left })
    }

    const onMouseUp = e => {
      e.stopPropagation()
      const parts = container.current.children
      const lineRect = parts[0].getBoundingClientRect()

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].children
        for (let j = 1; j < part.length; j++) {
          const el = part[j]

          if (el.tagName !== 'DIV') {
            continue
          }
          const elRect = el.getBoundingClientRect()
          
          if (lineRect.top > elRect.bottom
            || (lineRect.right + 4) < elRect.left
            || lineRect.bottom < elRect.top
            || (lineRect.left + 4) > elRect.right) {
            continue
          }
          store.setRangeStart(Number(el.dataset.id))
          setDragging(null)
          document.removeEventListener('mousemove', onMouseMove)
          return
        }
      }
    }
    setDragging({ top: currentTop, left: currentLeft })
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp, { once: true })
  }, [store.startHour, store.endHour, container, store.rangeEnd, store.moving])

  const onMouseDown = useCallback(e => {
    e.stopPropagation()
    const { clientX, clientY, target } = e
    const targetRect = target.getBoundingClientRect()
    const { classList, dataset } = target
    if (!classList.contains('selected') || dragging) {
      return
    }
    const id = Number(dataset.id)

    const startX = targetRect.left - (id - store.rangeStart) * 100
    const startY = targetRect.top

    const onMouseMove = e => {
      setMovingPosition(position => ({
        ...position,
        top: startY + e.clientY - clientY,
        left: startX + e.clientX - clientX,
      }))
    }

    store.setMoving(id)

    setMovingPosition({
      top: startY,
      left: startX,
      height: 50,
      width: ((store.rangeEnd - store.rangeStart) * 2 + 1) * 50
    })
    document.addEventListener(
      'mouseup',
      () => { 
        store.setMoving(null)
        setMovingPosition(null)
        document.removeEventListener('mousemove', onMouseMove)
      },
      { once: true }
    )
    document.addEventListener('mousemove', onMouseMove)
  }, [store.rangeStart, store.rangeEnd])

  const onMouseUp = useCallback(e => {
    // e.stopPropagation()
    const id = Number(e.target.dataset.id)
    if (!store.moving || dragging) {
      return
    }
    store.setRange(id, ID)
  }, [dragging])

  const getItems = useCallback(() => {
    const items = []

    for (let i = store.startHour; i < store.endHour; i++) {
      const parts = { left: i, right: i + 0.5 }
      const trailing = maxColumn && ((i + 0.5 - store.startHour) * 2 + 1) % (maxColumn - 1) === 0

      items.push(
        <div className={classes({ part: true, trailing })} key={i}>
          <p>{`${i}:00`}</p>
          {Object.entries(parts).map(([key, id]) => (
            <div 
              className={classes({
                [key]: true,
                moving: store.moving,
                selected: store.selected === ID && store.rangeStart <= id && id <= store.rangeEnd,
              })}
              onClick={onClickCell(id)}
              data-id={id}
              key={key}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
            >
              {store.selected === ID && id === store.rangeStart && !store.moving && <div className='resize-btn-left' onMouseDown={onDragLeft} />}
              {store.selected === ID && id === store.rangeEnd && !store.moving && <div className='resize-btn-right' onMouseDown={onDragRight} />}
            </div>
          ))}
          {i + 1 === store.endHour && <p className='last'>{`${store.endHour}:00`}</p>}
          {trailing && <p className='last'>{`${i + 1}:00`}</p>}
        </div>
      )
    }
    return items
  }, [store.startHour, store.endHour, store.rangeStart, store.rangeEnd, store.moving, maxColumn])

  return (
    <div className="timeline-picker" ref={container} onClick={e => e.stopPropagation()}>
      {dragging && <div className='dragging-line' style={dragging} />}
      {getItems()}
      {movingPosition && createPortal(
        <div className='moving-bar' key={'moving-bar'} style={movingPosition} />,
        document.body
      )}
    </div>
  )
})