import React from 'react'

export const FocusTrap = ({ component: Component, children, ...props }) =>
  <Component tabIndex="-1" {...props}>
    {children}
  </Component>

FocusTrap.propTypes = {
  onFocus: React.PropTypes.func,
  onBlur: React.PropTypes.func,
  component: React.PropTypes.any,
  children: React.PropTypes.node,
}

FocusTrap.defaultProps = {
  component: 'div',
}
