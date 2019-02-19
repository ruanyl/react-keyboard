import React from 'react'
import PropTypes from 'prop-types'
import Mousetrap from 'mousetrap'
import isEqual from 'lodash.isequal'
import { findDOMNode } from 'react-dom'

type Combo = string | string[]
type ComboWithEventType = {
  combo: Combo
  eventType?: string
}
export type Sequence = Combo | ComboWithEventType
export type Callback = (e: KeyboardEvent, combo: string) => any
interface SequenceHandler {
  combo: string | string[]
  callback: Callback
  eventType?: string
}

interface HotKeyContext {
  hotKeyParent: HotKeys
  hotKeyMap: KeyMap
}

export interface KeyMap {
  [key: string]: Sequence
}

export interface Handlers {
  [key: string]: Callback
}

function getSequencesFromMap(hotKeyMap: KeyMap, hotKeyName: string) {
  const sequences = hotKeyMap[hotKeyName]
  const result: Array<string | string[] | ComboWithEventType> = []
  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  // for example: ctrl+q
  if (!sequences) {
    return [hotKeyName]
  }
  return result.concat(sequences)
}

export type Navigator = (hotKeys: HotKeys) => string | string[] | null

interface HotKeysProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  name?: string
  keyMap?: KeyMap
  onFocus?: React.FocusEventHandler
  onBlur?: React.FocusEventHandler
  handlers?: Handlers
  style?: React.CSSProperties
  className?: string
  focusOnMount?: boolean
  navigator?: {
    [key: string]: string | string[] | Navigator | null
  }
}

export class HotKeys extends React.Component<HotKeysProps, {}> {

  static contextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
  }

  static childContextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
  }

  static defaultProps = {
    focusOnMount: true
  }

  context: HotKeyContext
  wrappedComponent = React.createRef<HTMLDivElement>()
  dom: HTMLElement | null
  mounted: boolean
  hotKeyMap: KeyMap
  mousetrap: MousetrapInstance
  name?: string
  hotKeyChain: HotKeys[]

  constructor(props: HotKeysProps) {
    super(props)
    this.dom = null
    this.name = props.name
  }

  getChildContext(): HotKeyContext {
    return {
      hotKeyParent: this,
      hotKeyMap: this.hotKeyMap,
    }
  }

  componentWillMount() {
    this.updateMap()
    if (this.context.hotKeyParent) {
      this.hotKeyChain = this.context.hotKeyParent.hotKeyChain
      this.hotKeyChain.push(this)
    } else {
      this.hotKeyChain = [this]
    }
  }

  componentDidMount() {
    this.dom = findDOMNode(this) as HTMLElement | null
    if (this.dom) {
      this.mousetrap = new Mousetrap(this.dom)
    }
    this.updateHotKeys(true)
    this.mounted = true

    let lastNodeInChain
    if (this.hotKeyChain) {
      lastNodeInChain = this.hotKeyChain[this.hotKeyChain.length - 1]
    }

    if (this.props.focusOnMount && this === lastNodeInChain && this.dom) {
      this.dom.focus()
    }
  }

  componentDidUpdate(prevProps: HotKeysProps) {
    this.updateHotKeys(false, prevProps)
  }

  componentWillUnmount() {
    if (this.mousetrap) {
      this.mousetrap.reset()
    }

    this.mounted = false
    // remove the current component from hotKeyChain
    let lastNodeInChain
    if (this.hotKeyChain) {
      this.hotKeyChain.splice(this.hotKeyChain.indexOf(this), 1)
      lastNodeInChain = this.hotKeyChain[this.hotKeyChain.length - 1]
    }

    // if current node has parent, and parent node is not root. focus on parent
    // otherwise, focus on the last node in the chain
    if (this.context.hotKeyParent && this.context.hotKeyParent.context.hotKeyParent && this.context.hotKeyParent.dom) {
      this.context.hotKeyParent.dom.focus()
    } else if (lastNodeInChain && lastNodeInChain.dom) {
      lastNodeInChain.dom.focus()
    }
  }

  buildMap() {
    const parentMap = this.context.hotKeyMap || {}
    const thisMap = this.props.keyMap || {}

    return { ...parentMap, ...thisMap }
  }

  updateMap() {
    const newMap = this.buildMap()

    if (!isEqual(newMap, this.hotKeyMap)) {
      this.hotKeyMap = newMap
      return true
    }
    return false
  }

  navigateTo = (target: string | string[] | null) => {
    const to = (next: string) => {
      const targetComponent = this.hotKeyChain.find(instance => {
        return instance.name === next
      })
      if (targetComponent && targetComponent.dom) {
        targetComponent.dom.focus()
        return true
      }
      return false
    }

    if (target) {
      if (typeof target === 'string') {
        to(target)
      } else {
        target.some(t => to(t))
      }
    }
  }

  updateHotKeys(force = false, prevProps?: HotKeysProps) {
    const handlers = this.props.handlers || {}
    const navigator = this.props.navigator || {}
    const prevHandlers = prevProps && prevProps.handlers || handlers

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && isEqual(handlers, prevHandlers) && !this.updateMap()) {
      return
    }

    let allSequenceHandlers: Array<SequenceHandler | undefined> = []

    // Group all our handlers by sequence
    Object.keys(handlers).concat(Object.keys(navigator)).forEach(hotKey => {
      const sequences = getSequencesFromMap(this.hotKeyMap, hotKey)
      const handler = handlers[hotKey]
      const navigatorHandler = navigator[hotKey]

      const sequenceHandlers: Array<SequenceHandler | undefined> = sequences.map(seq => {
        let combo, eventType, callback
        if (typeof seq === 'string' || Array.isArray(seq)) {
          combo = seq
        } else if (seq) {
          combo = seq.combo
          eventType = seq.eventType
        } else {
          return
        }

        if (!navigatorHandler) {
          callback = handler
        } else {
          callback = (e: KeyboardEvent, combo: string) => {
            if (typeof navigatorHandler === 'string' || Array.isArray(navigatorHandler)) {
              const target = navigatorHandler
              this.navigateTo(target)
            } else {
              const target = navigatorHandler(this)
              this.navigateTo(target)
            }
            if (handler) {
              return handler(e, combo)
            } else {
              // if no handler, the event should not bubble up
              return false
            }
          }
        }

        return { callback, eventType, combo }
      })
      allSequenceHandlers = allSequenceHandlers.concat(sequenceHandlers)
    })

    this.mousetrap.reset()
    allSequenceHandlers.forEach(handler => {
      if (handler) {
        this.mousetrap.bind(handler.combo, handler.callback, handler.eventType)
      }
    })
  }

  render() {
    const { navigator, children, keyMap, handlers, focusOnMount, ...props } = this.props

    return (
      <div {...props} ref={this.wrappedComponent} tabIndex={-1}>
        {children}
      </div>
    )
  }
}
export default HotKeys
