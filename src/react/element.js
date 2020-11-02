class Element {
  constructor(type, props) {
    // 存一遍
    this.type = type
    this.props = props
  }

}

function createElement (type, props = {}, ...children) {
  props.children = children
  // 这个就是虚拟DOM
  return new Element(type, props)
}


export {
  Element, createElement
}
