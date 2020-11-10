import { Element } from "./element";
import $ from "jquery";
import types from "./types";

let diffQueue = []; // 差异队列
let updateDepth = 0; //更新的级别
// 基类 不可以实例化
class Unit {
  constructor(element) {
    // 挂载在下划线 私有属性
    this._currentElement = element;
  }
  getMarkUp () {
    throw Error("此方法不可以被调用");
  }
}
class TextUint extends Unit {
  /**
   *
   * @param {*} reactId
   */
  getMarkUp (reactId) {
    this._reactId = reactId;
    return `<span data-reactid="${reactId}">${this._currentElement}</span>`;
  }
  update (nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      $(`[data-reactid="${this._reactId}"]`).html(nextElement);
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
    this._reactId = reactId;
    // type=Component=Counter props: { name: 'haha' }
    let { type: Component, props } = this._currentElement;
    // 实例化 后面还会用到
    // 当前的component实例 Counter的实例
    let componentInstance = (this._componentInstance = new Component(props));
    // 让组件的实例的currentUnit等于当前的unit
    componentInstance._currentUnit = this;

    // 渲染前要componentWillMount
    componentInstance.componentWillMount &&
      componentInstance.componentWillMount();
    // 调render方法 得到渲染的元素
    let renderElement = componentInstance.render();
    // 得到render的元素对应的unit
    // 当前组件render方法返回的元素对应的的unit 是Unit的实例 里面肯定有个_currentElement==当前组件render方法返回的元素
    let renderedInstance = (this._renderedInstance = createUnit(renderElement));
    // 调用方法 返回字符串
    let renderedMarkup = renderedInstance.getMarkUp(reactId);
    // 绑定事件
    $(document).on("mounted", () => {
      componentInstance.componentDidMount &&
        componentInstance.componentDidMount();
    });
    return renderedMarkup;
  }
  /**
   *
   * @param {*} nextElement 新元素
   * @param {*} partialState 新状态
   */
  update (nextElement, partialState) {
    // 新元素
    this._currentElement = nextElement || this._currentElement;
    let prevState = Object.assign({}, this._componentInstance.state);
    // 新状态 不光是否更新 组建的状态一定会修改  会修改目标值
    let nextState = Object.assign(this._componentInstance.state, partialState);
    // 新属性对象
    let nextProps = this._currentElement.props;
    const {
      shouldComponentUpdate,
      componentDidUpdate,
    } = this._componentInstance;
    if (shouldComponentUpdate && !shouldComponentUpdate(nextProps, nextState)) {
      return;
    }
    // DOM diff 比较上一次的结果和这次的结果

    // 上次的渲染的单元 是个Unit的实例
    let preRenderedInstance = this._renderedInstance; // text
    // 上次渲染的元素
    let preRenderedElement = preRenderedInstance._currentElement; //1
    // 获取新的render元素
    let nextRenderElement = this._componentInstance.render();
    // 判断是否进行深度比较
    // 新旧元素一样 深度比较
    // 不一样 就新的替换老的
    if (shouldDeepCompare(preRenderedElement, nextRenderElement)) {
      // 如果可以深度比较 则吧更新工作交给上次render渲染出来的元素的对应的unit来update
      // render的实例
      preRenderedInstance.update(nextRenderElement);
      componentDidUpdate && componentDidUpdate(prevState, nextProps);
    } else {
      this._renderedInstance = createUnit(nextRenderElement);
      let nextMarkUp = this._renderedInstance.getMarkUp(this._reactId);
      // 新的内容替换旧的节点
      $(`[data-reactid="${this._reactId}"]`).replaceWith(nextMarkUp);
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
    let oldType = typeof oldElement;
    let newType = typeof newElement;
    // 文本
    if (
      ["string", "number"].includes(oldType) &&
      ["string", "number"].includes(newType)
    ) {
      return true; // 可以直接替换了
    }
    if (oldElement instanceof Element && newElement instanceof Element) {
      // 两元素的type 一样深度比较，不一样就直接干掉
      return oldElement.type === newElement.type;
    }
  }
  return false;
}
class NativeUint extends Unit {
  /**
   *
   * @param {*} reactId
   */
  getMarkUp (reactId) {
    this._reactId = reactId;
    // this._currentElement为Element的实例
    const { type, props } = this._currentElement;
    console.log(props);
    let tagStart = `<${type} data-reactid="${reactId}" `;
    let childString = "";
    let tagEnd = `</${type}>`;
    this._renderedChildrenUnits = [];
    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) {
        // 需要绑定事件
        let eventName = propName.slice(2).toLowerCase();
        $(document).on(
          `${eventName}.${reactId}`,
          `[data-reactid="${reactId}"]`,
          props[propName]
        );
      } else if (propName === "style") {
        const styleObj = props[propName];
        // 样式对象 backgroundColor
        let styles = Object.entries(styleObj)
          .map(([attr, value]) => {
            attr = attr.replace(/[A-Z]/g, (m) => `-${m.toLocaleLowerCase()}`);
            return `${attr}:${value}`;
          })
          .join(";");
        tagStart += ` style="${styles}"`;
      } else if (propName === "children") {
        let children = props[propName];
        // 返回一个实例
        childString = children
          .map((child, index) => {
            let unit = createUnit(child);
            unit._mountIndex = index; //每个unit有个_mountIndex 指向自己在父节点的位置
            let str = unit.getMarkUp(`${reactId}.${index}`);
            this._renderedChildrenUnits.push(unit);
            return str;
          })
          .join("");
      } else if (propName === "className") {
        tagStart += ` class="${props[propName]}"`;
      } else {
        tagStart += ` ${propName}=${props[propName]} `;
      }
    }
    return tagStart + ">" + childString + tagEnd;
  }
  /**
   *
   * @param {*} nextElement 新元素
   */
  update (nextElement) {
    console.log("nextElement", nextElement);
    // 更新属性
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props;
    this.updateDomProperties(oldProps, newProps);
    this.updateDomChildren(nextElement.props.children);
  }
  /**
   * 传新的children 和就得children对比 找出差异
   * @param {*} newChildrenElement 新children
   */
  updateDomChildren (newChildrenElement) {
    updateDepth++;
    this.diff(diffQueue, newChildrenElement);
    updateDepth--;
    // 判断是否进行完成  全部遍历完成
    if (updateDepth === 0) {
      // 打补丁
      this.patch(diffQueue);
      diffQueue = [];
    }
  }
  patch (diffQueue) {
    // 真正改变DOM 改变
    console.log("diffQueue", diffQueue);
    let deleteChildren = []; // 放着要删除的节点
    let deleteMap = {}; // 复用的节点
    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i];
      if ([types.MOVE, types.REMOVE].includes(difference.type)) {
        let fromIndex = difference.fromIndex;
        let oldChild = $(difference.parentNode.children().get(fromIndex));
        deleteMap[fromIndex] = oldChild;
        deleteChildren.push(oldChild);
      }
    }
    $.each(deleteChildren, (idx, item) => {
      $(item).remove();
    });
    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i];
      switch (difference.type) {
        case types.INSERT:
          // 某个位置某个索引插入节点
          this.insertChildAt(
            difference.parentNode,
            difference.toIndex,
            $(difference.markUp)
          );
          break;
        case types.MOVE:
          this.insertChildAt(
            difference.parentNode,
            difference.toIndex,
            deleteMap[difference.fromIndex]
          );
          break;
        default:
          break;
      }
    }
  }
  insertChildAt (parentNode, index, node) {
    //  判断索引是不是有值的
    let oldChild = parentNode.children().get(index);
    // 有节点 插入到前面 不然直接在最后
    oldChild ? node.insertBefore(oldChild) : node.appendTo(parentNode);
  }

  /**
   *
   * @param {*} diffQueue 队列
   * @param {*} newChildrenElement 新的子元素
   */
  diff (diffQueue, newChildrenElement) {
    // 新旧节点map  key->old Unit
    let oldChildrenUnitMap = this.getOldChildrenMap(
      this._renderedChildrenUnits
    );
    // 新的 child unit 数组
    let { newChildrenUnitsMap, newChildrenUnits } = this.getNewChildren(
      oldChildrenUnitMap,
      newChildrenElement
    );
    // 旧的节点怎样才可以得到新的状态
    let lastIndex = 0; //上一个已经确定位置的索引 最后一个不需要动的索引
    // 处理新的节点
    for (let i = 0; i < newChildrenUnits.length; i++) {
      let newUnit = newChildrenUnits[i];
      // 第一个拿到A
      let newKey =
        (newUnit._currentElement.props && newUnit._currentElement.props.key) ||
        i.toString();
      let oldChildUnit = oldChildrenUnitMap[newKey];
      // 同一个对象
      if (oldChildUnit === newUnit) {
        if (oldChildUnit._mountIndex < lastIndex) {
          // 需要移动
          diffQueue.push({
            parentId: this._reactId,
            parentNode: $(`[data-reactid="${this._reactId}"]`), // DOM
            type: types.MOVE,
            fromIndex: oldChildUnit._mountIndex, //从自己的位置
            toIndex: i, //移动到当前
          });
        }
        // 可以复用 新老一致  放入大的Index
        lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex);
      } else {
        // 判断旧的 有就删除
        if (oldChildUnit) {
          diffQueue.push({
            parentId: this._reactId,
            parentNode: $(`[data-reactid="${this._reactId}"]`), // DOM
            type: types.REMOVE,
            fromIndex: oldChildUnit._mountIndex, //从自己的位置
          });
          // unit也要删除掉
          this._renderedChildrenUnits = this._renderedChildrenUnits.filter(item => item !== oldChildUnit)
          // 取消事件
          $(document).off(`.${oldChildUnit._reactId}`);
        }
        // 新旧不一样
        diffQueue.push({
          parentId: this._reactId,
          parentNode: $(`[data-reactid="${this._reactId}"]`), // DOM
          type: types.INSERT,
          toIndex: i, //移动到当前
          markUp: newUnit.getMarkUp(`${this._reactId}.${i}`), // 父亲id+儿子id
        });
      }
      // 索引值更新
      newUnit._mountIndex = i;
    }
    // 处理旧的节点 删除
    for (const oldKey in oldChildrenUnitMap) {
      let oldChildUnit = oldChildrenUnitMap[oldKey];
      // 不在新的里面
      if (!newChildrenUnitsMap.hasOwnProperty(oldKey)) {
        // 删除旧的节点
        diffQueue.push({
          parentId: this._reactId,
          parentNode: $(`[data-reactid="${this._reactId}"]`), // DOM
          type: types.REMOVE,
          fromIndex: oldChildUnit._mountIndex, //从自己的位置
        });
        // unit也要删除掉
        this._renderedChildrenUnits = this._renderedChildrenUnits.filter(item => item !== oldChildUnit)
        //  取消删除的unit的事件
        $(document).off(`.${oldChildUnit._reactId}`);

      }
    }
  }
  getNewChildren (oldChildrenUnitMap, newChildrenElement) {
    /**
     * 先找找老的有没有
     * 有就用 没有就创建新的
     */
    let newChildrenUnits = [];
    let newChildrenUnitsMap = {};
    newChildrenElement.forEach((newElement, index) => {
      let newKey =
        (newElement.props && newElement.props.key) || index.toString();
      let oldUnit = oldChildrenUnitMap[newKey]; // 找到老的Unit
      let oldElement = oldUnit && oldUnit._currentElement; // 老元素
      if (shouldDeepCompare(newElement, oldElement)) {
        // 一样可以复用 可以复用 更新
        oldUnit.update(newElement);
        newChildrenUnits.push(oldUnit);
        newChildrenUnitsMap[newKey] = oldUnit;
      } else {
        let nextUnit = createUnit(newElement);
        newChildrenUnits.push(nextUnit);
        newChildrenUnitsMap[newKey] = nextUnit;
        // 要把旧的替换掉
        this._renderedChildrenUnits[index] = nextUnit
      }
    });
    return { newChildrenUnits, newChildrenUnitsMap };
  }
  getOldChildrenMap (childUnits = []) {
    let map = {};
    for (let i = 0; i < childUnits.length; i++) {
      const unit = childUnits[i];
      let key =
        (unit._currentElement.props && unit._currentElement.props.key) ||
        i.toString();
      map[key] = unit;
    }
    return map;
  }
  /**
   * 更新属性
   * @param {*} oldProps
   * @param {*} newProps
   */
  updateDomProperties (oldProps, newProps) {
    let propName;
    // 循环老的属性集合
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        // 删除属性
        $(`[data-reactid="${this._reactId}"]`).removeAttr(propName);
      }
      if (/on[A-Z]/.test(propName)) {
        $(document).off(`.${this._reactId}`);
      }
    }
    for (propName in newProps) {
      if (propName === "children") {
        continue;
        // 单独处理
      } else if (/^on[A-Z]/.test(propName)) {
        // 需要绑定事件
        let eventName = propName.slice(2).toLowerCase();
        $(document).on(
          `${eventName}.${this._reactId}`,
          `[data-reactid="${this._reactId}"]`,
          newProps[propName]
        );
      } else if (propName === "style") {
        const styleObj = newProps[propName];
        // 样式对象 backgroundColor
        Object.entries(styleObj).map(([attr, value]) => {
          // 这里拿到的是已经处理过的
          $(`[data-reactid="${this._reactId}"]`).css(attr, value);
        });
      } else if (propName === "className") {
        $(`[data-reactid="${this._reactId}"]`).attr(
          "class",
          newProps[propName]
        );
      } else {
        $(`[data-reactid="${this._reactId}"]`).prop(
          propName,
          newProps[propName]
        );
      }
    }
  }
}
function createUnit (element) {
  if (["number", "string"].includes(typeof element)) {
    return new TextUint(element);
  } else if (
    element instanceof Element &&
    ["string"].includes(typeof element.type)
  ) {
    return new NativeUint(element);
  } else if (
    element instanceof Element &&
    ["function"].includes(typeof element.type)
  ) {
    return new CompositeUnit(element);
  }
}
export { createUnit };
