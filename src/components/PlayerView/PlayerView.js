import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape, roomShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/HostView/HostView.scss";

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

  /* Lifecycle methods. */

  render() {
    const { currentUser } = this.props;

    return (
      <div className="player-view">
        <h1>Player name: {currentUser.name}</h1>
        <button onClick={this.leaveRoom}>Leave Room</button>
      </div>
    );
  }

  /* Helpers. */

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
