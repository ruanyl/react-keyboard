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
  cmdK: ['command+k'],
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
    return false
  }
  const cmdK = (e, seq) => {
    console.log(`snap left with: ${seq}`)
  }
  const handlers = {
    cmdK,
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
The main changes here are to allow event to bubble:

`react-hotkeys` don't allow parent to handle the event if child has the a same handler. This behaviour works perfectly unless you need to do optional event handle.
For example, `onCancel` event should be handled in a certain condition in a child component other wise parent will handle it. However, `react-hotkeys` won't work in this case.

`react-keyboard` uses `mousetrap`. It respects the way how [mousetrap](https://github.com/ccampbell/mousetrap) handle event bubble:

> if event handler returns true, event bubbles to parent, if event handler returns false, it will not bubble

By default, the bubbling behaviour of `react-keyboard` is exactly the same as `mousetrap`: event bubbles up by default. But if the event handler returns `false`, then event will stop bubbling.

When handler returns `false`, internally `mousetrap` will do:

```
e.stopPropagation()
e.preventDefault()
```

If you don't want to `preventDefault`, simply do not `return false` and add `e.stopPropagation()` in your handler.

## Install
```
npm install react-keyboard
```

## Why not fork?
Write in `ES6 extends Component` manner and the principle changed.

## License
MIT
