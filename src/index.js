import React from './react'


// const ele='hello'

// <div onClick={()=>{console.log(1)}} style={{backgroundColor:'red'}}>你好<span class="test" id="thisisaspan">hehe</span></div>
const ele = React.createElement("div", {
  onClick: () => {
    console.log(1);
  },
  style: {
    backgroundColor: 'red'
  }
}, "\u4F60\u597D", /*#__PURE__*/React.createElement("span", {
  className: "test",
  id: "thisisaspan"
}, "hehe"));
React.render(ele, document.getElementById('root'))


