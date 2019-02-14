import React from 'react'
import { render } from 'react-dom'

import HotKeys, { Handlers } from '../src/HotKeys'

const keyMap = {
  cmdK: {
    combo: 'command+k',
  },
  deleteNode: ['del', 'backspace'],
  left: 'left',
  right: 'right',
  up: 'up',
  down: 'down',
}

interface NodeProps {
  style: React.CSSProperties
  children: React.ReactNode
  focusOnMount?: boolean
  name?: string
  navigator?: {
    [key: string]: string | string []
  }
}

class Node extends React.Component<NodeProps, {show: boolean}> {

  handlers: Handlers

  constructor(props: NodeProps) {
    super(props)
    this.handlers = {
      cmdK: this.cmdK,
      deleteNode: this.deleteNode,
    }
    this.state = {
      show: true,
    }
  }

  deleteNode = (e: KeyboardEvent, seq: string) => {
    console.log(`delete node with: ${seq}`)
    this.setState({ show: false })
    return false
  }

  cmdK = (e: KeyboardEvent, seq: string) => {
    console.log(`command + k with: ${seq}`)
    return false
  }

  render() {
    return (
      this.state.show ?
        <HotKeys handlers={this.handlers} {...this.props}>
          { this.props.children }
        </HotKeys> : null
    )
  }
}

const Leaf: React.SFC<{children: React.ReactNode, style: React.CSSProperties}> = ({ children, ...props }) => {
  // delete handler bubbles to it's parent
  const deleteNode = (e: KeyboardEvent, seq: string) => {
    console.log(`delete node with: ${seq}`)
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

render(
  <HotKeys keyMap={keyMap} style={{ border: '1px solid #0000ff' }}>
    Root wrapper
    <Node
      name="n1"
      style={{ border: '1px solid #ccc' }}
      navigator={{ down: ['n2-child', 'n2'] }}
    >
      Node1
      <Leaf style={{ border: '1px solid #ff0000' }}>
        Press `del` on me, event will be handled by `Node1` and the current node
      </Leaf>
    </Node>
    <Node
      name="n2"
      style={{ border: '1px solid #ccc' }}
      navigator={{ up: 'n1', down: 'n2-child' }}
    >
      Node2
      <Node
        name="n2-child"
        style={{ border: '1px solid #00ff00' }}
        navigator={{ up: 'n2' }}
      >Press `del` on me, event will be only handled by current node</Node>
    </Node>
  </HotKeys>,
  document.getElementById('root')
)
