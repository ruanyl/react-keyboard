# Navigation

You may need to navigate focus among HotKeys components with shortcuts, for example, use arrow keys/tab to navigate among different panels.

```typescript
  <HotKeys keyMap={keyMap}>
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
```

A `navigator` is similar to `handler`, which key is the keys that you have defined in `keyMap` but the values are the names of each `HotKeys` 

The values can be:

1. `string` The name of the `HotKeys` that you would like to navigate to when shortcuts pressed
2. `array` Array of string, which is a list of `name` it will loop from the first name until it find the first available `HotKeys`
3. `function` which return `string` or `string[]`

