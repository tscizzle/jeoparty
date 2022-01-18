import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";
import { setClientIdCookie } from "misc-helpers";

import { playerShape, roomShape } from "prop-shapes";
import withCurrentPlayer from "state-management/state-connectors/with-current-player";

import "./App.scss";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

class App extends Component {
  static propTypes = {
    /* supplied by withCurrentPlayer */
    currentPlayer: playerShape,
    fetchCurrentPlayer: PropTypes.func,
    currentRoom: roomShape,
    fetchCurrentRoom: PropTypes.func,
  };

  /* Lifecycle methods. */

  render() {
    const { currentPlayer, currentRoom } = this.props;

    const joinRoomDiv = (
      <div>
        <h1>Join Room</h1>
        <input placeholder="code"></input>
        <button>Join</button>
      </div>
    );

    const createRoomDiv = (
      <div>
        <h1>Create Room</h1>
        <button onClick={this.createRoom}>Create</button>
      </div>
    );

    let currentRoomDiv;
    if (currentRoom) {
      currentRoomDiv = (
        <div>
          <h1>Room code: {currentRoom.room_code}</h1>
        </div>
      );
    }

    let currentPlayerDiv;
    if (currentPlayer) {
      currentPlayerDiv = (
        <div>
          <h1>Player name: {currentPlayer.name}</h1>
        </div>
      );
    }

    return (
      <div className="App">
        {_.isNull(currentRoom) && joinRoomDiv}
        {_.isNull(currentRoom) && createRoomDiv}
        {!_.isNull(currentRoom) && currentRoomDiv}
        {!_.isNull(currentRoom) && currentPlayerDiv}
      </div>
    );
  }

  componentDidMount() {
    const { fetchCurrentPlayer, fetchCurrentRoom } = this.props;

    setClientIdCookie();

    fetchCurrentPlayer();
    fetchCurrentRoom();
  }

  /* Helpers. */

  createRoom = () => {
    const { fetchCurrentPlayer, fetchCurrentRoom } = this.props;

    api.createRoom().then(() => {
      fetchCurrentPlayer();
      fetchCurrentRoom();
    });
  };
}

App = withCurrentPlayer(App);
App = withCurrentRoom(App);

export default App;
