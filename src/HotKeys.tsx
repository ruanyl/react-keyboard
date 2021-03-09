import React from 'react'
import PropTypes from 'prop-types'
import Mousetrap from 'mousetrap'
import isEqual from 'lodash.isequal'

export type Combo = string | string[]
export type ComboWithEventType = {
  combo: Combo
  eventType?: string
}
export type Sequence = Combo | ComboWithEventType
export type Callback = (e: KeyboardEvent, combo: string) => any
export interface SequenceHandler {
  combo: string | string[]
  callback: Callback
  eventType?: string
}

export interface HotKeyContext {
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

export interface HotKeysProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  name?: string
  keyMap?: KeyMap
  handlers?: Handlers
  focusOnMount?: boolean
  navigator?: {
    [key: string]: string | string[] | Navigator | null
  }
  onNavigateIn?: (preLocation?: string) => void
  onNavigateOut?: () => void
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
    focusOnMount: true,
  }

  context: HotKeyContext
  wrappedComponent = React.createRef<HTMLDivElement>()
  mounted: boolean
  focused: boolean
  previousFocused: boolean
  hotKeyMap: KeyMap
  mousetrap: MousetrapInstance
  name?: string
  hotKeyChain: HotKeys[]
  focusOnMount: boolean

  constructor(props: HotKeysProps) {
    super(props)
    this.name = props.name
    this.focusOnMount = !!props.focusOnMount
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
    if (this.wrappedComponent.current) {
      this.mousetrap = new Mousetrap(this.wrappedComponent.current)
    }
    this.updateHotKeys(true)
    this.mounted = true

    let lastNodeInChain
    if (this.hotKeyChain) {
      lastNodeInChain = this.hotKeyChain[this.hotKeyChain.length - 1]
    }

    if (this.props.focusOnMount && this === lastNodeInChain && this.wrappedComponent.current) {
      this.wrappedComponent.current.focus()
    }
  }

  setFocus() {
    // 1. update existing hotkey components
    this.hotKeyChain.forEach(h => {
      if (h.focused) {
        h.focused = false
        h.previousFocused = true
      } else if (h.previousFocused) {
        h.previousFocused = false
      }
    })
    // 2. update current hotkey component
    this.focused = true
    this.previousFocused = false
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
    if (this.hotKeyChain) {
      this.hotKeyChain.splice(this.hotKeyChain.indexOf(this), 1)
    }

    // focus on previously focused hotkey component
    setTimeout(() => {
      this.hotKeyChain.forEach(h => {
        if (h.previousFocused) {
          h.wrappedComponent.current?.focus()
        }
      })
    })
  }

  buildMap() {
    const parentMap = this.context.hotKeyMap || {}
    const thisMap = this.props.keyMap || {}

    return {...parentMap, ...thisMap}
  }

  updateMap() {
    const newMap = this.buildMap()

    if (!isEqual(newMap, this.hotKeyMap)) {
      this.hotKeyMap = newMap
      return true
    }
    return false
  }

  focus = (preLocation?: string) => {
    if (this.wrappedComponent.current) {
      this.wrappedComponent.current.focus()
      if (this.props.onNavigateIn) {
        this.props.onNavigateIn(preLocation)
      }
    }
  }

  navigateTo = (target: string | string[] | null) => {
    const to = (next: string) => {
      const targetComponent = this.hotKeyChain.find(instance => {
        const dom = instance.wrappedComponent.current
        if (dom) {
          const style = window.getComputedStyle(dom)
          return instance.name === next && style.visibility !== 'hidden'
        }
        return false
      })
      if (targetComponent) {
        targetComponent.focus(this.props.name)
        return true
      }
      return false
    }

    if (target) {
      if (this.props.onNavigateOut) {
        this.props.onNavigateOut()
      }
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
    const prevHandlers = (prevProps && prevProps.handlers) || handlers

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && isEqual(handlers, prevHandlers) && !this.updateMap()) {
      return
    }

    let allSequenceHandlers: Array<SequenceHandler | undefined> = []

    // Group all our handlers by sequence
    Object.keys(handlers)
      .concat(Object.keys(navigator))
      .forEach(hotKey => {
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

          return {callback, eventType, combo}
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

  onFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (this.props.onFocus) {
      this.props.onFocus(e)
    }
    if (e.target === this.wrappedComponent.current) {
      this.setFocus()
    }
  }

  render() {
    const {
      navigator,
      children,
      keyMap,
      handlers,
      focusOnMount,
      onNavigateIn,
      onNavigateOut,
      onFocus,
      ...props
    } = this.props

    return (
      <div {...props} onFocus={this.onFocus} ref={this.wrappedComponent} tabIndex={-1}>
        {children}
      </div>
    )
  }
}
export default HotKeys
