import React, { Component } from 'react'

const App = () => (
  <div>
    <h1>Demo</h1>
    <Counter />
  </div>
)

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
      <div>
        { this.state.count }
        <br />
        <button onClick={this.handleClick}>click</button>
      </div>
    )
  }

}

export default App
