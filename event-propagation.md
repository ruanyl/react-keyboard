# Event Propagation

In the example of introduction, when press `command+k` when focus is on child, you will see the handlers of both child and parent are called. Use `e.stopPropagation` to avoid event propagation from child.

```typescript
  showChildDocumentation = (e: KeyboardEvent) => {
    console.log('show child doc')
    e.stopPropagation()
  }
```

Or simply `return false`

```typescript
  showChildDocumentation = () => {
    console.log('show child doc')
    return false
  }
```

this is the same as `e.stopPropagation()` + `e.preventDefault()`

