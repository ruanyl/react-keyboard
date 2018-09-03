import React from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  onRefUpdated: (ref: React.ReactInstance) => any
  onFocus: React.FocusEventHandler
  onBlur: React.FocusEventHandler
}

export class FocusTrap extends React.Component<FocusTrapProps, {}> {

  focusTrap = (ref: React.ReactInstance | null) => {
    if (ref) {
      this.props.onRefUpdated(ref)
    }
  }

  render() {
    const { children, onRefUpdated, ...props } = this.props
    return (
      <div ref={this.focusTrap} tabIndex={-1} {...props}>
        {children}
      </div>
    )
  }
}
