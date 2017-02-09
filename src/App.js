import React, { Component } from 'react'
import CSSModules from 'react-css-modules'

import styles from './styles/index.css'

const fn = e => {
  console.log(e)
  console.log('hello')
}

const App = () => (
  <div>
    <button
      onClick={fn}
      styleName="demo"
    >
      <span>Demo</span>
    </button>
    <Counter />
  </div>
)

// Use decorator to inject css modules to React components.
@CSSModules(styles, {allowMultiple: true})
class Counter extends Component {
  state = {
    count: 0
  }

  changeCount = () => {
    this.setState({ count: this.state.count + 10 })
  }

  handleClick = event => {
    event.preventDefault()
    this.changeCount()
  }

  render () {
    return (
      <div styleName="counter">
        <h1>Counter</h1>
        { this.state.count }
        <br />
        <button onClick={this.handleClick}>click</button>
      </div>
    )
  }
}

// `App` is a pure function component, which can't use decorator.
// Use high order component instead.
export default CSSModules(App, styles, {allowMultiple: true})
