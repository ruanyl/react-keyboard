import React from 'react'
import {render} from 'react-dom'

import HotKeys, {Handlers} from '../src/HotKeys'

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
  className?: string
  data: string[]
}

class Node extends React.Component<
  NodeProps,
  {show: boolean; data: string[]; selected: number; selections: number[]}
> {
  handlers: Handlers

  constructor(props: NodeProps) {
    super(props)
    this.handlers = {
      space: this.space,
      deleteNode: this.deleteNode,
    }
    this.state = {
      show: true,
      data: props.data,
      selected: -1,
      selections: [],
    }
  }

  space = (e: KeyboardEvent, seq: string) => {
    if (!this.state.selections.includes(this.state.selected)) {
      this.setState({selections: this.state.selections.concat(this.state.selected)})
    } else {
      this.setState({selections: this.state.selections.filter(s => s !== this.state.selected)})
    }
    return false
  }

  deleteNode = () => {
    this.setState({data: this.state.data.filter((_, i) => i !== this.state.selected), selected: -1})
  }

  render() {
    return (
      <HotKeys
        {...this.props}
        navigator={{
          up: () => (this.state.selected > 0 ? null : 'header'),
          down: `${this.props.name}0`,
          left: 'left',
          right: 'right',
        }}
      >
        {this.state.data.map((d, i) => {
          const itemSelected = this.state.selected === i
          return (
            <HotKeys
              onFocus={() => this.setState({selected: i})}
              key={d}
              name={`${this.props.name}${i}`}
              handlers={this.handlers}
              navigator={{
                up: i > 0 ? `${this.props.name}${i - 1}` : null,
                down: i < this.state.data.length - 1 ? `${this.props.name}${i + 1}` : null,
              }}
              className="item"
              style={{backgroundColor: itemSelected ? '#aaffcc' : '#fff'}}
            >
              <span>
                {d}
                {itemSelected ? '(try to press: /space/ and arrow keys)' : ''}
              </span>
              {this.state.selections.includes(i) ? <span>✅</span> : null}
            </HotKeys>
          )
        })}
      </HotKeys>
    )
  }
}

render(
  <HotKeys keyMap={keyMap} className="container">
    <HotKeys name="header" className="header" navigator={{down: 'left'}}>
      This is a demo of react-keyboard (use arrow key to navigate between panels)
    </HotKeys>
    <div className="content">
      <Node name="left" className="left" data={['Apple', 'Orange', 'Rice', 'Banana']} />
      <Node name="right" className="right" data={['Apple', 'Orange', 'Rice', 'Banana']} />
    </div>
  </HotKeys>,
  document.getElementById('root')
)
