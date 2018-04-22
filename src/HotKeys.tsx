import * as React from 'react'
import { findDOMNode } from 'react-dom'
import * as Mousetrap from 'mousetrap'
import * as PropTypes from 'prop-types'

import isEqual = require('lodash/isEqual')
import { FocusTrap } from './FocusTrap'

function getSequencesFromMap(hotKeyMap: KeyMap, hotKeyName: string): Array<string | ObjectSequence> {
  const sequences = hotKeyMap[hotKeyName]
  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  // for example: ctrl+q
  if (!sequences) {
    return [hotKeyName]
  }
  const result: Array<string | ObjectSequence> = []
  return result.concat(sequences)
}

export interface HotKeysProps {
  keyMap?: KeyMap;
  handlers?: Handlers;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  focusOnMount?: boolean;
  style?: React.CSSProperties;
}

export interface KeyMap {
  [key: string]: string | string[] | ObjectSequence;
}

export interface Handlers {
  [key: string]: (e?: KeyboardEvent, s?: string) => boolean | void;
}

export interface Context {
  hotKeyParent: React.ReactInstance | null;
  hotKeyMap: KeyMap;
  hotKeyChain: React.ReactInstance[];
}

export type KeyAction = 'keypress' | 'keydown' | 'keyup';

export interface ObjectSequence {
  sequence: string;
  action: KeyAction;
}

export interface SequenceHandler {
  callback: (event: KeyboardEvent, actualSeq: string) => void;
  sequence: string | string[];
  action?: KeyAction;
}

export class HotKeys extends React.Component<HotKeysProps, {}> {

  // React.ReactElement
  wrappedComponent: Element | null
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

  getChildContext(): Context {
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
    this.dom = findDOMNode(this) as HTMLElement
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

  onFocus = (e: React.FocusEvent<HTMLElement>) => {
    if (this.props.onFocus) {
      this.props.onFocus(e)
    }
  }

  onBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (this.props.onBlur) {
      this.props.onBlur(e)
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

    let allSequenceHandlers: SequenceHandler[] = []

    // Group all handlers by sequence
    Object.keys(handlers).forEach(hotKey => {
      const sequences = getSequencesFromMap(this.hotKeyMap, hotKey)
      const handler = handlers[hotKey]

      const sequenceHandlers = sequences.map(seq => {
        let action: KeyAction | undefined
        let sequence: string | ObjectSequence
        if (typeof seq === 'string') {
          sequence = seq
        } else {
          action = seq.action
          sequence = seq.sequence
        }

        return { callback: handler, action, sequence }
      })
      allSequenceHandlers = allSequenceHandlers.concat(sequenceHandlers)
    })

    this.mousetrap.reset()
    allSequenceHandlers.forEach(handler => {
      this.mousetrap.bind(handler.sequence, handler.callback, handler.action)
    })
  }

  onChildRefUpdate = (node: Element) => {
    this.wrappedComponent = node
  }

  render() {
    /* eslint-disable no-unused-vars */
    const { children, keyMap, handlers, focusOnMount, ...props } = this.props

    return (
      <FocusTrap {...props} onRefUpdated={this.onChildRefUpdate} onFocus={this.onFocus} onBlur={this.onBlur}>
        {children}
      </FocusTrap>
    )
  }
}
