import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { roomShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import JGameDisplay from "components/JGameDisplay/JGameDisplay";
import jeopardyBackground from "assets/jeopardy_background.jpg";

import "components/InGameView/InGameView.scss";

class InGameView extends Component {
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

  componentDidMount() {
    const { currentRoom, fetchCurrentRoom, fetchJGameData } = this.props;

    const { id: room_id, source_game_id } = currentRoom;
    fetchJGameData({ sourceGameId: source_game_id });

    // TODO: do the URL part in api.js, using the host/origin variable.
    // TODO: make a InGameView which has this room subscription stuff, and has the split
    // between PlayerView and HostView that we currently do in App)
    const searchParams = new URLSearchParams({ roomId: room_id }).toString();
    const eventSource = new EventSource(
      `http://localhost:5000/subscribe-to-room-updates?${searchParams}`
    );
    eventSource.onmessage = (evt) => {
      console.log(`got message: ${evt.data}`);
      const msg = JSON.parse(evt.data);
      switch (msg.TYPE) {
        case "ROOM_UPDATE": {
          fetchCurrentRoom();
          break;
        }
      }
    };
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

InGameView = withCurrentUser(InGameView);
InGameView = withCurrentRoom(InGameView);
InGameView = withJGameData(InGameView);

export default InGameView;
