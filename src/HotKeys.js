import React, { Component } from 'react'
import PropTypes from 'prop-types'
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
    children: PropTypes.node,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    keyMap: PropTypes.object,
    handlers: PropTypes.object,
    focusOnMount: PropTypes.bool,
  }

  static defaultProps = {
    focusOnMount: true,
  }

  static contextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
  }

  static childContextTypes = {
    hotKeyParent: PropTypes.any,
    hotKeyMap: PropTypes.object,
  }

  constructor(props) {
    super(props)
    this.wrappedComponent = null
    this.dom = null
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
    this.dom = findDOMNode(this)
    this.mousetrap = new Mousetrap(this.dom)
    this.updateHotKeys(true)
    if (this.props.focusOnMount) {
      this.dom.focus()
    }
  }

  componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps)
  }

  componentWillUnmount() {
    if (this.mousetrap) {
      this.mousetrap.reset()
    }
    const hotKeyParent = this.context.hotKeyParent
    if (hotKeyParent && hotKeyParent.dom) {
      hotKeyParent.dom.focus()
    }
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
      <FocusTrap {...props} onRefUpdated={childNode => { this.wrappedComponent = childNode }} onFocus={this.onFocus} onBlur={this.onBlur}>
        {children}
      </FocusTrap>
    )
  }
}
