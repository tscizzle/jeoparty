import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape, roomShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/PlayerView/PlayerView.scss";

class PlayerView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
  };

  state = {
    typedPlayerName: "",
  };

  /* Lifecycle methods. */

  render() {
    const { typedPlayerName, currentUser } = this.props;

    return (
      <div className="player-view">
        <h1 className="player-name-header">PLAYER NAME: {currentUser.name}</h1>
          <div className="player-input">
            <input
                placeholder="Enter text"
                value={typedPlayerName}
                onChange={this.onChangeTypedPlayerName}
              />
            <button onClick={this.registerName}>Register Name</button>
            <button onClick={this.leaveRoom}>Leave Room</button>
          </div>
      </div>
    );
  }

  /* Helpers. */

  onChangeTypedPlayerName = (evt) => {
    this.setState({ typedPlayerName: evt.target.value.toUpperCase() });
  };

  registerName = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    api.registerName().then(() => {
      fetchCurrentUser();
      fetchCurrentRoom();
    });
  };

  leaveRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    api.leaveRoom().then(() => {
      fetchCurrentUser();
      fetchCurrentRoom();
    });
  };
}

PlayerView = withCurrentUser(PlayerView);
PlayerView = withCurrentRoom(PlayerView);
PlayerView = withJGameData(PlayerView);


export default PlayerView;
