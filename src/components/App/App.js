import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { playerShape } from "prop-shapes";
import withCurrentPlayer from "state-management/state-connectors/with-current-player";

import "./App.scss";

class App extends Component {
  static propTypes = {
    /* supplied by withCurrentPlayer */
    currentPlayer: playerShape,
    fetchCurrentPlayer: PropTypes.func,
  };

  /* Lifecycle methods. */

  render() {
    const { currentPlayer } = this.props;

    return (
      <div className="App">
        <h1>Join Room</h1>
        <input placeholder="code"></input>
        <button onClick={this.initGame}>Join</button>

        <h1>Create Room</h1>
        <button onClick={this.initGame}>Create</button>

        {currentPlayer && <h1>Player name: {currentPlayer.name}</h1>}
      </div>
    );
  }

  componentDidMount() {
    const { fetchCurrentPlayer } = this.props;

    fetchCurrentPlayer();
  }

  /* Helpers. */

  initGame = () => {
    api.initGame();
  };
}

App = withCurrentPlayer(App);

export default App;
