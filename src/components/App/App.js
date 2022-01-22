import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";
import { setClientIdCookie } from "misc-helpers";

import { playerShape, roomShape } from "prop-shapes";
import withCurrentPlayer from "state-management/state-connectors/with-current-player";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import "./App.scss";

class App extends Component {
  static propTypes = {
    /* supplied by withCurrentPlayer */
    currentPlayer: playerShape,
    fetchCurrentPlayer: PropTypes.func,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape,
    fetchCurrentRoom: PropTypes.func,
  };

  state = {
    typedRoomCode: "",
    roomCodeError: null,
  };

  /* Lifecycle methods. */

  render() {
    const { currentPlayer, currentRoom } = this.props;
    const { typedRoomCode, roomCodeError } = this.state;

    const joinRoomDiv = (
      <div>
        <h1>Join Room</h1>
        <input
          placeholder="ROOM CODE"
          value={typedRoomCode}
          onChange={this.onChangeTypedRoomCode}
        />
        <button onClick={this.joinRoom}>Join</button>
        {roomCodeError && (
          <div className="room-code-error">{roomCodeError}</div>
        )}
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
          <h1>
            Player name: <input value={currentPlayer.name} />
          </h1>
        </div>
      );
    }

    const leaveRoomDiv = (
      <div>
        <button onClick={this.leaveRoom}>Leave Room</button>
      </div>
    );

    return (
      <div className="app">
        {_.isNull(currentRoom) && joinRoomDiv}
        {_.isNull(currentRoom) && createRoomDiv}
        {!_.isNull(currentRoom) && currentRoomDiv}
        {!_.isNull(currentRoom) && currentPlayerDiv}
        {!_.isNull(currentRoom) && leaveRoomDiv}
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

  onChangeTypedRoomCode = (evt) => {
    this.setState({ typedRoomCode: evt.target.value.toUpperCase() });
  };

  createRoom = () => {
    const { fetchCurrentPlayer, fetchCurrentRoom } = this.props;

    api.createRoom().then(() => {
      fetchCurrentPlayer();
      fetchCurrentRoom();
    });
  };

  joinRoom = () => {
    const { fetchCurrentPlayer, fetchCurrentRoom } = this.props;
    const { typedRoomCode } = this.state;

    api.joinRoom({ roomCode: typedRoomCode }).then((res) => {
      if (res.success) {
        fetchCurrentPlayer();
        fetchCurrentRoom();
      } else {
        this.setState({ roomCodeError: res.reason });
        setTimeout(() => this.setState({ roomCodeError: null }), 3000);
      }
    });
  };

  leaveRoom = () => {
    const { fetchCurrentPlayer, fetchCurrentRoom } = this.props;

    api.leaveRoom().then(() => {
      fetchCurrentPlayer();
      fetchCurrentRoom();
    });
  };
}

App = withCurrentPlayer(App);
App = withCurrentRoom(App);

export default App;
