import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { roomShape, jGameDataShape } from "prop-shapes";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import JGameDisplay from "components/JGameDisplay/JGameDisplay";
import jeopardyBackground from "assets/jeopardy_background.jpg";

import "components/HostView/HostView.scss";

class HostView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
    fetchJGameData: PropTypes.func.isRequired,
  };

  state = {
    isLoadingLeaving: false,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom, jGameData } = this.props;
    const { isLoadingLeaving } = this.state;

    const showLoading = !jGameData.sourceGame || isLoadingLeaving;
    const showGame = jGameData.sourceGame;

    return (
      <div
        className="host-view"
        style={{ backgroundImage: `url(${jeopardyBackground})` }}
      >
        {showLoading && <div>Loading…</div>}
        {showGame && <JGameDisplay currentRound="single" />}
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

    this.setState({ isLoadingLeaving: true }, () => {
      api
        .leaveRoom()
        .then(() => {
          fetchCurrentUser();
          fetchCurrentRoom();
        })
        .then(() => {
          this.setState({ isLoadingLeaving: false });
        });
    });
  };
}

HostView = withCurrentRoom(HostView);
HostView = withJGameData(HostView);

export default HostView;
