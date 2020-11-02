import { Element } from './element'
import $ from 'jquery'
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
  /**
   * 
   * @param {*} reactId 
   */
  getMarkUp (reactId) {
    this._reactId = reactId
    return `<span data-reactid="${reactId}">${this._currentElement}</span>`
  }
}
class NativeUint extends Unit {
  /**
   * 
   * @param {*} reactId 
   */
  getMarkUp (reactId) {
    this._reactId = reactId
    // this._currentElement为Element的实例
    const { type, props } = this._currentElement
    console.log(props)
    let tagStart = `<${type} data-reactid="${reactId}" `
    let childString = ''
    let tagEnd = `</${type}>`
    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) {
        // 需要绑定事件
        let eventName = propName.slice(2).toLowerCase()
        $(document).on(`${eventName}.${reactId}`, `[data-reactid="${reactId}"]`, props[propName])
      } else if (propName === 'style') {
        const styleObj = props[propName]
        // 样式对象 backgroundColor
        let styles = Object.entries(styleObj).map(([attr, value]) => {
          attr = attr.replace(/[A-Z]/g, (m) => `-${m.toLocaleLowerCase()}`)
          return `${attr}:${value}`
        }).join(';')
        tagStart += ` style="${styles}"`

      } else if (propName === 'children') {
        let children = props[propName]
        // 返回一个实例
        childString = children.map((child, index) => {
          let unit = createUnit(child)
          let str = unit.getMarkUp(`${reactId}.${index}`)
          return str
        }).join('')
        console.log(childString)

      } else if (propName === 'className') {
        tagStart += ` class="${props[propName]}"`
      } else {
        tagStart += ` ${propName}=${props[propName]} `
      }

    }
    return tagStart + '>' + childString + tagEnd
  }
}
function createUnit (element) {
  if (['number', 'string'].includes(typeof element)) {
    return new TextUint(element)
  } else if (element instanceof Element && ['string'].includes(typeof element.type)) {
    return new NativeUint(element)
  }
}
export { createUnit }
