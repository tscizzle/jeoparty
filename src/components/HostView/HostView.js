import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";

import { userShape, roomShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayersInRoom from "state-management/state-connectors/with-players-in-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import JGameDisplay from "components/JGameDisplay/JGameDisplay";
import jeopardyBackground from "assets/jeopardy_background.jpg";

import "components/HostView/HostView.scss";

class LobbyView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withPlayersInRoom */
    playersInRoom: PropTypes.objectOf(userShape),
  };

  state = {
    isLoadingStartingGame: false,
  };

  render() {
    const { playersInRoom } = this.props;

    const playerList = _(playersInRoom)
      .values()
      .map((player) => (
        <div key={player.id}>{player.registered_name || player.id}</div>
      ))
      .value();

    const canStartGame = playerList.length > 0;

    return (
      <div className="lobby-view">
        <div className="player-list">{playerList}</div>
        <button onClick={this.startGame} disabled={!canStartGame}>
          Start Game
        </button>
      </div>
    );
  }

  /* Helpers. */

  startGame = () => {
    const { currentRoom, fetchCurrentRoom } = this.props;

    const { id: room_id } = currentRoom;

    this.setState({ isLoadingStartingGame: true }, () => {
      api
        .startGame({ roomId: room_id })
        .then(() => {
          return fetchCurrentRoom();
        })
        .then(() => {
          this.setState({ isLoadingStartingGame: false });
        });
    });
  };
}

LobbyView = withCurrentRoom(LobbyView);
LobbyView = withPlayersInRoom(LobbyView);

class HostView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser*/
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
  };

  state = {
    isLoadingLeavingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom, jGameData } = this.props;
    const { isLoadingStartingGame, isLoadingLeavingRoom } = this.state;

    const showLoading =
      !jGameData || isLoadingStartingGame || isLoadingLeavingRoom;
    const showGame = currentRoom.has_game_been_started && jGameData;

    return (
      <div
        className="host-view"
        style={{ backgroundImage: `url(${jeopardyBackground})` }}
      >
        {showLoading && <div>Loading…</div>}
        {showGame ? (
          <JGameDisplay currentRound="single" />
        ) : (
          <LobbyView />
        )}
        <div className="host-controls">
          <label>ROOM CODE</label>
          <b className="room-code">{currentRoom.room_code}</b>
          <button className="leave-room-button" onClick={this.leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  /* Helpers. */

  leaveRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    this.setState({ isLoadingLeavingRoom: true }, () => {
      api
        .leaveRoom()
        .then(() => {
          return Promise.all([fetchCurrentUser(), fetchCurrentRoom()]);
        })
        .then(() => {
          this.setState({ isLoadingLeavingRoom: false });
        });
    });
  };
}

HostView = withCurrentUser(HostView);
HostView = withCurrentRoom(HostView);
HostView = withJGameData(HostView);

export default HostView;
