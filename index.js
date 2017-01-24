import React from 'react'
import { render } from 'react-dom'

import { HotKeys } from './src/HotKeys'

const keyMap = {
  snapLeft: ['command+k'],
  deleteNode: ['del', 'backspace'],
}

const Node = ({ children, ...props }) => {
  const deleteNode = (e, seq) => {
    console.log(`delete node with: ${seq}`)
  }
  const snapLeft = (e, seq) => {
    console.log(`snap left with: ${seq}`)
  }
  const handlers = {
    snapLeft,
    deleteNode,
  }
  return (
    <HotKeys handlers={handlers} {...props}>
      { children }
    </HotKeys>
  )
}

Node.propTypes = {
  children: React.PropTypes.any,
}

const Leaf = ({ children, ...props }) => {
  // delete handler bubbles to it's parent
  const deleteNode = (e, seq) => {
    console.log(`delete node with: ${seq}`)
    return true
  }
  const handlers = {
    deleteNode,
  }
  return (
    <HotKeys handlers={handlers} {...props}>
      { children }
    </HotKeys>
  )
}

Leaf.propTypes = {
  children: React.PropTypes.any,
}

render(
  <HotKeys keyMap={keyMap}>
    <Node style={{ border: '1px solid #ccc' }}>
      Node1
      <Leaf style={{ border: '1px solid #ff0000' }}>Press `del` on me, event will be handled by `Node1` and the current node</Leaf>
    </Node>
    <Node style={{ border: '1px solid #ccc' }}>
      Node2
      <Node style={{ border: '1px solid #00ff00' }}>Press `del` on me, event will be only handled by current node</Node>
    </Node>
  </HotKeys>,
  document.getElementById('root')
)
