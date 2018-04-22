import * as React from 'react'
import { render } from 'react-dom'

import { HotKeys, Handlers } from '../src'

const keyMap = {
  cmdK: ['command+k'],
  deleteNode: ['del', 'backspace'],
}

interface NodeProps {
  style: React.CSSProperties;
  focusOnMount?: boolean;
}

interface NodeState {
  show: boolean;
}

class Node extends React.Component<NodeProps, NodeState> {

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

interface LeafProps {
  style: React.CSSProperties;
};

const Leaf: React.SFC<LeafProps> = props => {
  // delete handler bubbles to it's parent
  const deleteNode = (e: KeyboardEvent, seq: string) => {
    console.log(`delete node with: ${seq}`)
  }
  const handlers = {
    deleteNode,
  }
  return (
    <HotKeys handlers={handlers} {...props}>
      { props.children }
    </HotKeys>
  )
}

render(
  <HotKeys keyMap={keyMap} style={{ border: '1px solid #0000ff' }}>
    Root wrapper
    <Node style={{ border: '1px solid #ccc' }}>
      Node1
      <Leaf style={{ border: '1px solid #ff0000' }}>
        Press `del` on me, event will be handled by `Node1` and the current node
      </Leaf>
    </Node>
    <Node focusOnMount={false} style={{ border: '1px solid #ccc' }}>
      Node2
      <Node style={{ border: '1px solid #00ff00' }}>Press `del` on me, event will be only handled by current node</Node>
    </Node>
  </HotKeys>,
  document.getElementById('root')
)
