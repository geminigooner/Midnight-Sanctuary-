const React = require('react');

function wrapText(child) {
  if (typeof child === 'string') {
    return child.split(/(\s+)/).map((t, i) => React.createElement('span', { key: i, className: t.trim() ? "animate-word-glow" : "" }, t));
  }
  if (React.isValidElement(child)) {
    if (child.props && child.props.children) {
      return React.cloneElement(child, {
        ...child.props,
        children: React.Children.map(child.props.children, wrapText)
      });
    }
  }
  return child;
}
console.log("OK");
