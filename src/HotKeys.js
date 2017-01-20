import React, { Component } from 'react'
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

export class HotKeys extends Component {

  static propTypes = {
    allowBubble: React.PropTypes.bool,
    active: React.PropTypes.bool,
    children: React.PropTypes.node,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    keyMap: React.PropTypes.object,
    handlers: React.PropTypes.object,
  }

  static contextTypes = {
    hotKeyParent: React.PropTypes.any,
    hotKeyMap: React.PropTypes.object,
  }

  static childContextTypes = {
    hotKeyParent: React.PropTypes.any,
    hotKeyMap: React.PropTypes.object,
  }

  constructor(props) {
    super(props)
    this.isActive = true
  }

  getChildContext() {
    return {
      hotKeyParent: this,
      hotKeyMap: this.hotKeyMap,
    }
  }

  componentWillMount() {
    this.updateMap()
  }

  componentDidMount() {
    this.mousetrap = new Mousetrap(findDOMNode(this))

    if (!this.props.allowBubble && this.context.hotKeyParent) {
      this.context.hotKeyParent.isActive = false
    }

    this.updateHotKeys(true)
  }

  componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps)
  }

  componentWillUnmount() {
    if (this.mousetrap) {
      this.mousetrap.reset()
    }
  }

  onFocus = ({ ...args }) => {
    this.isActive = true
    if (this.props.onFocus) {
      this.props.onFocus(...args)
    }
  }

  onBlur = ({ ...args }) => {
    this.isActive = false
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

  updateHotKeys(force = false, prevProps = {}) {
    const { handlers = {} } = this.props
    const { handlers: prevHandlers = handlers } = prevProps

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && isEqual(handlers, prevHandlers) && !this.updateMap()) {
      return
    }

    const hotKeyMap = this.getMap()
    let allSequenceHandlers = []
    const that = this

    // Group all our handlers by sequence
    Object.keys(handlers).forEach(hotKey => {
      const sequences = getSequencesFromMap(hotKeyMap, hotKey)
      const handler = handlers[hotKey]

      const sequenceHandlers = sequences.map(seq => {
        const { action, sequence = seq } = seq
        const callback = (event, actualSeq) => {
          const isActive = that.props.active || that.isActive

          if (isActive) {
            // follow event bubble rule of mousetrap(which is also the same as jquery)
            // when handler return false: do not propagation
            // when handler return true: do propagation
            const shouldPropagation = handler(event, actualSeq)
            if (that.context.hotKeyParent) {
              if (shouldPropagation) {
                that.context.hotKeyParent.isActive = true
              } else {
                that.context.hotKeyParent.isActive = false
              }
            }
            return shouldPropagation
          }
          return null
        }

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
    const { children, keyMap, handlers, allowBubble, ...props } = this.props

    return (
      <FocusTrap {...props} onFocus={this.onFocus} onBlur={this.onBlur}>
        {children}
      </FocusTrap>
    )
  }
}
