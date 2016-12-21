import React, { Component } from 'react';

const App = () => (
  <div>
    <h1>Demo</h1>
    <Counter />
  </div>
);

class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
    };
    this.changeCount = this.changeCount.bind(this);
  }

  changeCount() {
    this.setState({ count: this.state.count + 10 });
  }

  render() {
    return (
      <div>
        { this.state.count }
        <br />
        <button onClick={this.changeCount}>click</button>
      </div>
    );
  }

}

export default App;
