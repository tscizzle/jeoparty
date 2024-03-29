import React, { Component } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import _ from "lodash";

import api from "api";

import { userShape, roomShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayers from "state-management/state-connectors/with-players";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import Loading from "components/Loading/Loading";
import NiceButton from "components/NiceButton/NiceButton";
import JGameDisplay from "components/JGameDisplay/JGameDisplay";
import Scoreboard from "components/Scoreboard/Scoreboard";
import jeopardyBackground from "assets/jeopardy_background.jpg";

import "components/HostView/HostView.scss";

class LobbyView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withPlayers */
    players: PropTypes.objectOf(userShape),
  };

  state = {
    isLoadingStartingGame: false,
  };

  /* Lifecycle methods. */

  render() {
    const { players } = this.props;

    const playerList = _(players)
      .values()
      .map((player) => (
        <div className="player-in-lobby" key={player.id}>
          {player.registered_name || player.id}
        </div>
      ))
      .value();

    const canStartGame = playerList.length > 0;

    return (
      <div className="lobby-view">
        <div className="player-list">{playerList}</div>
        <NiceButton
          isPrimary={true}
          isBig={true}
          onClick={this.startGame}
          isDisabled={!canStartGame}
        >
          Start Game
        </NiceButton>
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
LobbyView = withPlayers(LobbyView);

class HostControls extends Component {
  static propTypes = {
    /* supplied by withCurrentUser*/
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    isLoadingLeavingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom } = this.props;
    const { isLoadingLeavingRoom } = this.state;

    const { room_code, has_game_been_started } = currentRoom;

    const hostControlsClasses = classNames("host-controls", {
      "has-game-been-started": has_game_been_started,
    });

    return (
      <div className={hostControlsClasses}>
        <label>ROOM CODE</label>
        <b className="room-code">{room_code}</b>
        <NiceButton isPrimary={true} onClick={this.leaveRoom}>
          Quit
        </NiceButton>
        {isLoadingLeavingRoom && <Loading />}
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

HostControls = withCurrentUser(HostControls);
HostControls = withCurrentRoom(HostControls);

class HostView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
  };

  render() {
    const { currentRoom, jGameData } = this.props;

    const showLoading = !jGameData;
    const showGame = Boolean(currentRoom.has_game_been_started && jGameData);

    return (
      <div
        className="host-view"
        style={{ backgroundImage: `url(${jeopardyBackground})` }}
      >
        {showLoading && <Loading />}
        {showGame ? <JGameDisplay /> : <LobbyView />}
        {showGame && <Scoreboard />}
        <HostControls />
      </div>
    );
  }
}

HostView = withCurrentRoom(HostView);
HostView = withJGameData(HostView);

export default HostView;
