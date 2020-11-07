class Component {
  constructor(props) {
    this.props = props
  }
  setState (partialState) {
    // 每个单元都会有update
    // 新元素 新状态
    this._currentUnit.update(null, partialState)
  }
}
export { Component }
