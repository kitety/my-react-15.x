// 基类 不可以实例化
class Unit {
  constructor(element) {
    // 挂载在下划线 私有属性
    this._currentElement = element
  }
  getMarkUp () {
    throw Error('此方法不可以被调用')
  }
}
class TextUint extends Unit {
  getMarkUp (reactId) {
    this._reactId = reactId
    return `<span data-reactid="${reactId}">${this._currentElement}</span>`
  }
}
function createUnit (element) {
  if (['number', 'string'].includes(typeof element)) {
    return new TextUint(element)
  }


}
export { createUnit }
