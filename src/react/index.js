import $ from 'jquery';
import { createUnit } from './unit'
import { createElement } from './element'
import { Component } from './component'
const React = {
  render,
  rootIndex: 0,
  createElement, Component
}
/**
 *
 * @param {*} element 文本 DOM 自定义组件
 * @param {*} container 
 */
function render (element, container) {
  // container.innerHTML = `<span data-reactid="${React.rootIndex}">${element}</span>`
  // 传入元素 返回对应的unit(对象实例)
  // unit 负责渲染 主要用来将元素转换为html字符串
  let unit = createUnit(element)
  let markUp = unit.getMarkUp(React.rootIndex) // 返回HTML标记
  $(container).html(markUp)
  $(document).trigger('mounted')
}

export default React
