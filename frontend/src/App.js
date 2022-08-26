import React, { Component } from 'react'

import GraphEditor from './components/GraphEditor';

import './styles/App.scss';

export class App extends Component {
  render() {
    return (
      <div>
        <h1>GEMF_FAVITES STR GUI</h1>
        <GraphEditor />
      </div>
    )
  }
}

export default App