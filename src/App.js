import React, { Component } from 'react';
import CSSModules from 'react-css-modules';

import styles from './styles/index.css';


const fn = e => {
  console.log(e);
  console.log('hello');
}

const App = () => (
  <div>
    <button styleName="demo" onClick={fn}>
      <span>Demo</span>
    </button>
    <Counter />
  </div>
);

const Counter = CSSModules(class Counter extends Component {
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
      <div styleName="counter">
        <h1>Counter</h1>
        { this.state.count }
        <br />
        <button onClick={this.changeCount}>click</button>
      </div>
    );
  }
}, styles, {allowMultiple: true});

export default CSSModules(App, styles, {allowMultiple: true});
