import * as React from 'react'
import { findDOMNode } from 'react-dom'
import Mousetrap from 'mousetrap'

import isEqual from 'lodash/isEqual'
import { FocusTrap } from './FocusTrap'

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  const sequences = hotKeyMap[hotKeyName]
  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  // for example: ctrl+q
  if (!sequences) {
    return [hotKeyName]
  }
  return [].concat(sequences)
}

interface HotKeysProps {
  onFocus: React.FocusEventHandler<HTMLElement>;
  onBlur: React.FocusEventHandler<HTMLElement>;
  keyMap: KeyMap;
  handlers: Handlers;
  focusOnMount: boolean;
}

interface KeyMap {
  [key: string]: string[];
}

interface Handlers {
  [key: string]: (e?: React.FocusEvent<HTMLElement>, s?: string) => boolean | void;
}

export class HotKeys extends React.Component<HotKeysProps, {}> {

  // React.ReactElement
  wrappedComponent: React.ReactNode
  dom: HTMLElement | null
  isLast: boolean
  hotKeyMap: KeyMap
  mousetrap: MousetrapInstance
  mounted: boolean

  static defaultProps = {
    focusOnMount: true,
  }

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

  constructor(props: HotKeysProps) {
    super(props)
    this.wrappedComponent = null
    this.dom = null
    this.isLast = true
  }

  getChildContext() {
    return {
      hotKeyParent: this,
      hotKeyMap: this.hotKeyMap,
      hotKeyChain: this.context.hotKeyChain ? this.context.hotKeyChain : [this],
    }
  }

  componentWillMount() {
    this.updateMap()
    if (this.context.hotKeyChain && this.props.focusOnMount) {
      this.context.hotKeyChain.push(this)
    }
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.isLast = false
    }
  }

  componentDidMount() {
    if (this.dom) {
      this.mousetrap = new Mousetrap(this.dom as Element)
    }
    this.updateHotKeys(true)
    this.mounted = true

    let lastNodeInChain
    if (this.context.hotKeyChain) {
      lastNodeInChain = this.context.hotKeyChain[this.context.hotKeyChain.length - 1]
    }

    if (this.props.focusOnMount && (this === lastNodeInChain || this.isLast) && this.dom) {
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

    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.isLast = true
    }

    // focus on last component in the chain
    if (lastNodeInChain && lastNodeInChain.dom) {
      lastNodeInChain.dom.focus()
    }
  }

  setDom(node: HTMLElement) {
    this.dom = node
  }

  onFocus = ({ ...args }) => {
    if (this.props.onFocus) {
      this.props.onFocus(...args)
    }
  }

  onBlur = ({ ...args }) => {
    if (this.props.onBlur) {
      this.props.onBlur(...args)
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

  updateHotKeys(force: boolean = false, prevProps?: HotKeysProps) {
    const handlers = this.props.handlers ? this.props.handlers : {}
    let prevHandlers = handlers
    if (prevProps && prevProps.handlers) {
      prevHandlers = prevProps.handlers
    }

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && isEqual(handlers, prevHandlers) && !this.updateMap()) {
      return
    }

    const hotKeyMap = this.getMap()
    let allSequenceHandlers = []

    // Group all our handlers by sequence
    Object.keys(handlers).forEach(hotKey => {
      const sequences = getSequencesFromMap(hotKeyMap, hotKey)
      const handler = handlers[hotKey]

      const sequenceHandlers = sequences.map(seq => {
        const { action, sequence = seq } = seq
        // follow event bubble rule of mousetrap(which is also the same as jquery)
        // when handler return false: stop propagation
        const callback = (event, actualSeq) => handler(event, actualSeq)

        return { callback, action, sequence }
      })
      allSequenceHandlers = allSequenceHandlers.concat(sequenceHandlers)
    })

    this.mousetrap.reset()
    allSequenceHandlers.forEach(handler => {
      this.mousetrap.bind(handler.sequence, handler.callback, handler.action)
    })
  }

  render() {
    /* eslint-disable no-unused-vars */
    const { children, keyMap, handlers, focusOnMount, ...props } = this.props

    return (
      <FocusTrap ref={this.setDom} {...props} onRefUpdated={childNode => { this.wrappedComponent = childNode }} onFocus={this.onFocus} onBlur={this.onBlur}>
        {children}
      </FocusTrap>
    )
  }
}
