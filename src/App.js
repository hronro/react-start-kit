import React from 'react';
import CSSModules from 'react-css-modules';

import styles from './styles/index.css';


const fn = e => {
  console.log(e);
  console.log('hello');
}

const App = () => (
  <div styleName="demo" onClick={fn}>
    <span>Demo</span>
  </div>
);

export default CSSModules(App, styles, {allowMultiple: true});
