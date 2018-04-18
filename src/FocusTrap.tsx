import * as React from 'react'
import PropTypes from 'prop-types'

export const FocusTrap = ({ component: Component, children, onRefUpdated, ...props }) =>
  <Component ref={onRefUpdated} tabIndex="-1" {...props}>
    {children}
  </Component>

FocusTrap.propTypes = {
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onRefUpdated: PropTypes.func,
  component: PropTypes.any,
  children: PropTypes.node,
}

FocusTrap.defaultProps = {
  component: 'div',
  onRefUpdated: () => true,
}
