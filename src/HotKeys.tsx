import React from 'react'
import PropTypes from 'prop-types'
import Mousetrap from 'mousetrap'
import isEqual from 'lodash.isequal'
import { findDOMNode } from 'react-dom'

type Combo = string | string[]
type ComboWithAction = {
  combo: Combo
  action?: string
}
export type Sequence = Combo | ComboWithAction
export type Callback = (e: KeyboardEvent, combo: string) => any
interface SequenceHandler {
  combo: string | string[]
  callback: Callback
  action?: string
}

interface HotKeyContext {
  hotKeyParent: HotKeys
  hotKeyMap: KeyMap
  hotKeyChain: HotKeys[]
}

export interface KeyMap {
  [key: string]: Sequence
}

export interface Handlers {
  [key: string]: Callback
}

function getSequencesFromMap(hotKeyMap: KeyMap, hotKeyName: string) {
  const sequences = hotKeyMap[hotKeyName]
  const result: Array<string | string[] | ComboWithAction> = []
  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  // for example: ctrl+q
  if (!sequences) {
    return [hotKeyName]
  }
  return result.concat(sequences)
}

interface HotKeysProps {
  children: React.ReactNode
  keyMap?: KeyMap
  onFocus?: React.FocusEventHandler
  onBlur?: React.FocusEventHandler
  handlers?: Handlers
  style?: React.CSSProperties
  className?: string
}

export class HotKeys extends React.Component<HotKeysProps, {}> {

  static contextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
    hotKeyChain: PropTypes.array,
  }

  static childContextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
    hotKeyChain: PropTypes.array,
  }

  wrappedComponent: React.ReactInstance | null
  dom: HTMLElement | null
  mounted: boolean
  hotKeyMap: KeyMap
  mousetrap: MousetrapInstance

  constructor(props: HotKeysProps) {
    super(props)
    this.wrappedComponent = null
    this.dom = null
  }

  getChildContext(): HotKeyContext {
    return {
      hotKeyParent: this,
      hotKeyMap: this.hotKeyMap,
      hotKeyChain: this.context.hotKeyChain ? this.context.hotKeyChain : [this],
    }
  }

  componentWillMount() {
    this.updateMap()
    if (this.context.hotKeyChain) {
      this.context.hotKeyChain.push(this)
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
    if (this.context.hotKeyChain) {
      lastNodeInChain = this.context.hotKeyChain[this.context.hotKeyChain.length - 1]
    }

    if (this === lastNodeInChain && this.dom) {
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
    if (this.context.hotKeyChain) {
      this.context.hotKeyChain.splice(this.context.hotKeyChain.indexOf(this), 1)
      lastNodeInChain = this.context.hotKeyChain[this.context.hotKeyChain.length - 1]
    }

    // if current node has parent, and parent node is not root. focus on parent
    // otherwise, focus on the last node in the chain
    if (this.context.hotKeyParent && this.context.hotKeyParent.hotKeyParent && this.context.hotKeyParent.dom) {
      this.context.hotKeyParent.dom.focus()
    } else if (lastNodeInChain && lastNodeInChain.dom) {
      lastNodeInChain.dom.focus()
    }
  }

  getMap() {
    return this.hotKeyMap
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

  updateHotKeys(force = false, prevProps?: HotKeysProps) {
    const handlers = this.props.handlers || {}
    const prevHandlers = prevProps && prevProps.handlers || handlers

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && isEqual(handlers, prevHandlers) && !this.updateMap()) {
      return
    }

    const hotKeyMap = this.getMap()
    let allSequenceHandlers: Array<SequenceHandler | undefined> = []

    // Group all our handlers by sequence
    Object.keys(handlers).forEach(hotKey => {
      const sequences = getSequencesFromMap(hotKeyMap, hotKey)
      const handler = handlers[hotKey]

      const sequenceHandlers: Array<SequenceHandler | undefined> = sequences.map(seq => {
        let combo, action
        if (typeof seq === 'string' || Array.isArray(seq)) {
          combo = seq
        } else if (seq) {
          combo = seq.combo
          action = seq.action
        } else {
          return
        }

        return { callback: handler, action, combo }
      })
      allSequenceHandlers = allSequenceHandlers.concat(sequenceHandlers)
    })

    this.mousetrap.reset()
    allSequenceHandlers.forEach(handler => {
      if (handler) {
        this.mousetrap.bind(handler.combo, handler.callback, handler.action)
      }
    })
  }

  focusTrap = (ref: React.ReactInstance | null) => {
    if (ref) {
      this.wrappedComponent = ref
    }
  }

  render() {
    const { children, keyMap, handlers, ...props } = this.props

    return (
      <div {...props} ref={this.focusTrap} tabIndex={-1}>
        {children}
      </div>
    )
  }
}
export default HotKeys
