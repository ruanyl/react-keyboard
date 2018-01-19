import React, { Component } from 'react'
import { render } from 'react-dom'

import { HotKeys } from './src/HotKeys'

const keyMap = {
  cmdK: ['command+k'],
  deleteNode: ['del', 'backspace'],
}

class Node extends Component {

  constructor(props) {
    super(props)
    this.handlers = {
      cmdK: this.cmdK,
      deleteNode: this.deleteNode,
    }
    this.state = {
      show: true,
    }
  }

  deleteNode = (e, seq) => {
    console.log(`delete node with: ${seq}`)
    this.setState({ show: false })
    return false
  }

  cmdK = (e, seq) => {
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

Node.propTypes = {
  children: React.PropTypes.any,
}

const Leaf = ({ children, ...props }) => {
  // delete handler bubbles to it's parent
  const deleteNode = (e, seq) => {
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

Leaf.propTypes = {
  children: React.PropTypes.any,
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
