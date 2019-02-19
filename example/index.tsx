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
  space: 'space',
}

interface NodeProps {
  style?: React.CSSProperties
  focusOnMount?: boolean
  name?: string
  className?: string;
  data: string[];
}

class Node extends React.Component<NodeProps, {show: boolean, data: string[], selected: number, selections: number[]}> {

  handlers: Handlers

  constructor(props: NodeProps) {
    super(props)
    this.handlers = {
      up: this.up,
      down: this.down,
      space: this.space,
    }
    this.state = {
      show: true,
      data: props.data,
      selected: -1,
      selections: []
    }
  }

  up = (e: KeyboardEvent, seq: string) => {
    this.setState({ selected: this.state.selected - 1 < 0 ? this.state.selected : this.state.selected - 1 })
  }

  down = (e: KeyboardEvent, seq: string) => {
    this.setState({ selected: this.state.selected + 1 >= this.state.data.length ? this.state.selected : this.state.selected + 1 })
  }

  space = (e: KeyboardEvent, seq: string) => {
    if (!this.state.selections.includes(this.state.selected)) {
      this.setState({ selections: this.state.selections.concat(this.state.selected) })
    } else {
      this.setState({ selections: this.state.selections.filter(s => s !== this.state.selected) })
    }
    return false;
  }

  render() {
    return (
      <HotKeys
        {...this.props}
        handlers={this.handlers}
        navigator={{
          up: () => this.state.selected > 0 ? null : 'header',
          left: 'left',
          right: 'right',
        }}
      >
        {
          this.props.data.map((d, i) => {
            const itemSelected = this.state.selected === i
            return (
              <div key={d} className="item" style={{ backgroundColor: itemSelected ? '#aaffcc' : '#fff' }}>
                <span>{d}{itemSelected ? '(try to press: /space/ and arrow keys)' : ''}</span>
                {this.state.selections.includes(i) ? <span>✅</span> : null}
              </div>
            )
          })
        }
      </HotKeys>
    )
  }
}

export class MyHotKeys extends React.Component {

  showDocumentation = () => {
    console.log('show doc')
  }
  deleteNode = () => {
    console.log('deleted')
  }
  moveLeft = () => {
    console.log('move left')
  }
  showChildDocumentation = (e: KeyboardEvent) => {
    console.log('show child doc')
    e.stopPropagation()
  }

  handlersParent = {
    cmdK: this.showDocumentation,
    deleteNode: this.deleteNode,
  }

  handlersChild = {
    cmdK: this.showChildDocumentation,
    left: this.moveLeft,
  }

  render() {
    return <HotKeys keyMap={keyMap} handlers={this.handlersParent}>
      <HotKeys name="header" navigator={{ down: ['left', 'right'] }}>
        header
      </HotKeys>
      <HotKeys name="left" navigator={{ up: 'header', right: 'right' }}>
        left
      </HotKeys>
      <HotKeys name="right" navigator={{ up: 'header', left: 'left' }}>
        right
      </HotKeys>
    </HotKeys>
  }
}

render(
  <HotKeys keyMap={keyMap} className="container">
    <MyHotKeys />
    <HotKeys name="header" className="header" navigator={{ down: 'left' }}>
      This is a demo of react-keyboard (use arrow key to navigate between panels)
    </HotKeys>
    <div className="content">
      <Node
        name="left"
        className="left"
        data={[ 'Apple', 'Orange', 'Rice', 'Banana' ]}
      />
      <Node
        name="right"
        className="right"
        data={[ 'Apple', 'Orange', 'Rice', 'Banana' ]}
      />
    </div>
  </HotKeys>,
  document.getElementById('root')
)
