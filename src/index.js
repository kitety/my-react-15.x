import React from './react'


// const ele='hello'

// <div onClick={()=>{console.log(1)}} style={{backgroundColor:'red'}}>你好<span class="test" id="thisisaspan">hehe</span></div>

// const ele = React.createElement("div", {
//   onClick: () => {
//     console.log(1);
//   },
//   style: {
//     backgroundColor: 'red'
//   }
// }, "\u4F60\u597D", /*#__PURE__*/React.createElement("span", {
//   className: "test",
//   id: "thisisaspan"
// }, "hehe"));

// class Counter extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = { number: 1 }
//   }
//   componentWillMount () {
//     console.log('Counter componentWillMount')
//   }
//   componentDidMount () {
//     console.log('Counter componentDidMount')
//   }
//   handleClick = () => {
//     this.setState({ number: this.state.number + 1 })
//   }

//   render () {
//     return <div onClick={() => { console.log(1) }} style={{ backgroundColor: 'red' }}>
//       你好{this.props.name}<span class="test" id="thisisaspan">数字是：{this.state.number}</span><button onClick={this.handleClick}>+</button>
//     </div>
//   }
// }
// class Counter extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = { number: 1 }
//   }
//   componentWillMount () {
//     console.log('Counter componentWillMount')
//   }
//   componentDidMount () {
//     console.log('Counter componentDidMount')
//   }
//   handleClick = () => {
//     this.setState({ number: this.state.number + 1 })
//   }
//   render () {
//     console.log('render')

//     return /*#__PURE__*/React.createElement("div", {
//       onClick: () => {
//         console.log(1);
//       },
//       style: {
//         backgroundColor: 'red'
//       }
//     }, "\u4F60\u597D", this.props.name, /*#__PURE__*/React.createElement("span", {
//       class: "test",
//       id: "thisisaspan"
//     }, "\u6570\u5B57\u662F\uFF1A", this.state.number), /*#__PURE__*/React.createElement("button", {
//       onClick: this.handleClick
//     }, "+"));
//   }
// }
// class Counter extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = { number: 1 }
//   }
//   componentWillMount () {
//     console.log('Counter componentWillMount')
//   }
//   componentDidMount () {
//     console.log('Counter componentDidMount')
//     // setInterval(() => {
//     this.setState({ number: this.state.number + 1 })
//     // }, 1000);
//   }
//   shouldComponentUpdate () {
//     return true
//   }
//   componentDidUpdate (a) {
//     console.log('Counter componentDidUpdate', a)

//   }
//   handleClick = () => {
//     this.setState({ number: this.state.number + 1 })
//   }
//   render () {
//     console.log('render')

//     return this.state.number
//   }
// }
// class Counter extends React.Component {
//   constructor(props) {
//     super(props)
//     this.state = { number: 1 }
//   }
//   handleClick = () => {
//     this.setState({ number: this.state.number + 1 })
//   }
//   render () {
//     let p = React.createElement('p', {}, this.state.number)
//     let button = React.createElement('button', { onClick: this.handleClick }, '+')
//     return React.createElement('div', { style: { color: this.state.number % 2 === 0 ? 'red' : 'green' } }, p, button)
//   }
// }
class Counter extends React.Component {
  constructor(props) {
    super(props)
    this.state = { odd: true }
  }
  componentDidMount () {
    setTimeout(() => {
      this.setState({ odd: false })
    }, 2000);
  }
  render () {
    if (this.state.odd) {
      return React.createElement('ul', { id: 'oldCounter' },
        React.createElement('li', { key: 'A' }, 'A'),
        React.createElement('li', { key: 'B' }, 'B'),
        React.createElement('li', { key: 'C' }, 'C'),
        React.createElement('li', { key: 'D' }, 'D')
      );
    }
    //diffQueue=[]
    return React.createElement('ul', { id: 'newCounter' },
      React.createElement('span', { key: 'A' }, 'A1'),
      React.createElement('li', { key: 'C' }, 'C1'),
      React.createElement('li', { key: 'B' }, 'B1'),
      React.createElement('li', { key: 'E' }, 'E1'),
      React.createElement('li', { key: 'F' }, 'F1')
    );
  }
}
const ele = React.createElement(Counter, { name: 'haha' })
React.render(ele, document.getElementById('root'))


