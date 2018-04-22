import * as React from 'react'

export interface FocusTrapProps {
  component?: React.ReactType<any>;
  onRefUpdated?: (node: Element | React.ReactElement<any>) => void;
  onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
  onBlur? : (e: React.FocusEvent<HTMLElement>) => void;
}

export const FocusTrap: React.SFC<FocusTrapProps> = ({ component: C = 'div', children, onRefUpdated = () => true, ...props }) =>
  <C ref={onRefUpdated} tabIndex="-1" {...props}>
    {children}
  </C>
