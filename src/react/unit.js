import { Element } from './element'
import $ from 'jquery'

let diffQueue = [] // 差异队列
let updateDepth = 0 //更新的级别
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
  update (nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement
      $(`[data-reactid="${this._reactId}"]`).html(nextElement)
    }


  }
}
// 复合单元 渲染的是里面的render
class CompositeUnit extends Unit {
  /**
   * 
   * @param {*} reactId 
   */
  getMarkUp (reactId) {
    this._reactId = reactId
    // type=Component=Counter props: { name: 'haha' }
    let { type: Component, props } = this._currentElement
    // 实例化 后面还会用到
    // 当前的component实例 Counter的实例
    let componentInstance = this._componentInstance = new Component(props)
    // 让组件的实例的currentUnit等于当前的unit
    componentInstance._currentUnit = this

    // 渲染前要componentWillMount
    componentInstance.componentWillMount && componentInstance.componentWillMount()
    // 调render方法 得到渲染的元素
    let renderElement = componentInstance.render()
    // 得到render的元素对应的unit
    // 当前组件render方法返回的元素对应的的unit 是Unit的实例 里面肯定有个_currentElement==当前组件render方法返回的元素
    let renderedInstance = this._renderedInstance = createUnit(renderElement)
    // 调用方法 返回字符串
    let renderedMarkup = renderedInstance.getMarkUp(reactId)
    // 绑定事件
    $(document).on('mounted', () => {
      componentInstance.componentDidMount && componentInstance.componentDidMount()
    })
    return renderedMarkup
  }
  /**
   * 
   * @param {*} nextElement 新元素
   * @param {*} partialState 新状态
   */
  update (nextElement, partialState) {
    // 新元素
    this._currentElement = nextElement || this._currentElement
    let prevState = Object.assign({}, this._componentInstance.state)
    // 新状态 不光是否更新 组建的状态一定会修改  会修改目标值
    let nextState = Object.assign(this._componentInstance.state, partialState)
    // 新属性对象
    let nextProps = this._currentElement.props
    const { shouldComponentUpdate, componentDidUpdate } = this._componentInstance
    if (shouldComponentUpdate && !shouldComponentUpdate(nextProps, nextState)) {
      return
    }
    // DOM diff 比较上一次的结果和这次的结果

    // 上次的渲染的单元 是个Unit的实例
    let preRenderedInstance = this._renderedInstance  // text 
    // 上次渲染的元素
    let preRenderedElement = preRenderedInstance._currentElement  //1
    // 获取新的render元素 
    let nextRenderElement = this._componentInstance.render()
    // 判断是否进行深度比较
    // 新旧元素一样 深度比较 
    // 不一样 就新的替换老的
    if (shouldDeepCompare(preRenderedElement, nextRenderElement)) {
      // 如果可以深度比较 则吧更新工作交给上次render渲染出来的元素的对应的unit来update
      // render的实例
      preRenderedInstance.update(nextRenderElement)
      componentDidUpdate && componentDidUpdate(prevState, nextProps)

    } else {
      this._renderedInstance = createUnit(nextRenderElement)
      let nextMarkUp = this._renderedInstance.getMarkUp(this._reactId)
      // 新的内容替换旧的节点
      $(`[data-reactid="${this._reactId}"]`).replaceWith(nextMarkUp)
    }

  }
}

/**
 * 判断类型是不是一样的
 * @param {*} preRenderedElement 
 * @param {*} nextRenderElement 
 */
function shouldDeepCompare (oldElement, newElement) {
  if (oldElement && newElement) {
    let oldType = typeof oldElement
    let newType = typeof newElement
    // 文本
    if ((['string', 'number'].includes(oldType) && ['string', 'number'].includes(newType))) {
      return true  // 可以直接替换了
    }
    if (oldElement instanceof Element && newElement instanceof Element) {
      // 两元素的type 一样深度比较，不一样就直接干掉
      return oldElement.type === newElement.type
    }
  }
  return false
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
    this._renderedChildrenUnits = []
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
          this._renderedChildrenUnits.push(unit)
          return str
        }).join('')


      } else if (propName === 'className') {
        tagStart += ` class="${props[propName]}"`
      } else {
        tagStart += ` ${propName}=${props[propName]} `
      }

    }
    return tagStart + '>' + childString + tagEnd
  }
  /**
 * 
 * @param {*} nextElement 新元素
 */
  update (nextElement) {
    console.log('nextElement', nextElement);
    // 更新属性
    let oldProps = this._currentElement.props
    let newProps = nextElement.props
    this.updateDomProperties(oldProps, newProps)
    this.updateDomChildren(nextElement.props.children)
  }
  /**
   * 传新的children 和就得children对比 找出差异
   * @param {*} newChildrenElement 新children
   */
  updateDomChildren (newChildrenElement) {
    this.diff(diffQueue, newChildrenElement)
  }/**
   * 
   * @param {*} diffQueue 队列
   * @param {*} newChildrenElement 新的子元素
   */
  diff (diffQueue, newChildrenElement) {
    // 新旧节点map  key
    let oldChildrenUnitMap = this.getOldChildrenMap(this._renderedChildrenUnits)
    let newChildren = this.getNewChildren(oldChildrenUnitMap, newChildrenElement)

  }
  getNewChildren (oldChildrenUnitMap, newChildrenElement) {
    /**
     * 先找找老的有没有
     * 有就用 没有就创建新的
     */
    let newChildren = []
    newChildrenElement.forEach((newElement, index) => {
      let newKey = (newElement.props && newElement.props.key) || index.toString()
      let oldUnit = oldChildrenUnitMap[newKey]// 找到老的Unit
      let oldElement = oldUnit && oldUnit._currentElement// 老元素
      if (shouldDeepCompare(newElement, oldElement)) {
        // 一样可以复用 可以复用 更新
        oldUnit.update(newElement)
        newChildren.push(oldUnit)
      } else {
        let nextUnit = createUnit(newElement)
        newChildren.push(nextUnit)
      }
    })
    return newChildren
  }
  getOldChildrenMap (childUnits = []) {
    let map = {}
    for (let i = 0; i < childUnits.length; i++) {
      const unit = childUnits[i];
      let key = (unit._currentElement.props && unit._currentElement.props.key) || i.toString()
      map[key] = unit
    }
    return map
  }
  /**
   * 更新属性
   * @param {*} oldProps 
   * @param {*} newProps 
   */
  updateDomProperties (oldProps, newProps) {
    let propName
    // 循环老的属性集合
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        // 删除属性
        $(`[data-reactid="${this._reactId}"]`).removeAttr(propName)
      } if (/on[A-Z]/.test(propName)) {
        $(document).off(`.${this._reactId}`)
      }
    }
    for (propName in newProps) {
      if (propName === 'children') {
        continue
        // 单独处理
      } else if (/^on[A-Z]/.test(propName)) {
        // 需要绑定事件
        let eventName = propName.slice(2).toLowerCase()
        $(document).on(`${eventName}.${this._reactId}`, `[data-reactid="${this._reactId}"]`, newProps[propName])
      } else if (propName === 'style') {
        const styleObj = newProps[propName]
        // 样式对象 backgroundColor
        Object.entries(styleObj).map(([attr, value]) => {
          // 这里拿到的是已经处理过的
          $(`[data-reactid="${this._reactId}"]`).css(attr, value)
        })
      } else if (propName === 'className') {
        $(`[data-reactid="${this._reactId}"]`).attr('class', newProps[propName])
      } else {
        $(`[data-reactid="${this._reactId}"]`).props(propName, newProps[propName])
      }

    }
  }

}
function createUnit (element) {
  if (['number', 'string'].includes(typeof element)) {
    return new TextUint(element)
  } else if (element instanceof Element && ['string'].includes(typeof element.type)) {
    return new NativeUint(element)
  } else if (element instanceof Element && ['function'].includes(typeof element.type)) {
    return new CompositeUnit(element)
  }
}
export { createUnit }
