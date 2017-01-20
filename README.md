## React HotKeys
-------------
This is an opinionated refactor of [react-hotkeys](https://github.com/chrisui/react-hotkeys), please use it at your own risk

## run the example:
```
node server.js
```

## Quick Example

```javascript
import {HotKeys} from 'react-keyboard';

// Simple "name:key sequence/s" to create a hotkey map
const keyMap = {
  snapLeft: ['command+k'],
  deleteNode: ['del', 'backspace'],
}

// render the component
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
```

## what has been changed compare to react-hotkeys
The main change here is allowing event to bubble:

`react-hotkeys` will not allow parent to handle the event if child has the a same handler. This behaviour works perfectly unless you need to do optional event handle.
For example, `onCancel` event should be handled in a certain condition in child other wise parent will handle it. However, `react-hotkeys` won't work in this case.

`react-keyboard` uses `mousetrap`. It respects the way how [mousetrap](https://github.com/ccampbell/mousetrap) handle event bubble:

> if event handler returns true, event bubbles to parent, if event handler returns false, it will not bubble

By default, the bubbling behaviour of `react-keyboard` is exactly the same as `react-hotkeys`: if event handled by child, then parent will not be aware of this event. But if the event handler returns `true`,
then event `bubble` to parent.

## Install
```
npm install react-keyboard
```

## License
MIT
