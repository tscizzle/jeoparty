import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import HostView from "components/HostView/HostView";
import PlayerView from "components/PlayerView/PlayerView";

import "components/InRoomView/InRoomView.scss";

class InRoomView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    /* supplied by withCurrentRoom */
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withPlayers */
    fetchPlayers: PropTypes.func.isRequired,
    /* supplied by withSubmissions */
    fetchSubmissions: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
    fetchJGameData: PropTypes.func.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { currentUser, jGameData } = this.props;

    const showLoading = !jGameData;
    const showHostView = Boolean(currentUser.is_host && jGameData);
    const showPlayerView = Boolean(!currentUser.is_host && jGameData);

    return (
      <div className="in-game">
        {showLoading && <div>Loading…</div>}
        {showHostView && <HostView />}
        {showPlayerView && <PlayerView />}
      </div>
    );
  }

  componentDidMount() {
    const {
      currentRoom,
      fetchCurrentRoom,
      fetchPlayers,
      fetchSubmissions,
      fetchJGameData,
    } = this.props;

    const { id: room_id } = currentRoom;

    fetchPlayers();
    fetchSubmissions();
    fetchJGameData();

    const eventSource = api.subscribeToRoomUpdates({ roomId: room_id });
    eventSource.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      switch (msg.TYPE) {
        case "ROOM_UPDATE": {
          fetchCurrentRoom();
          break;
        }

        case "PLAYERS_UPDATE": {
          fetchPlayers();
          break;
        }

        case "SUBMISSION_UPDATE": {
          fetchSubmissions();
          break;
        }

        default: {
          break;
        }
      }
    };
  }
}

InRoomView = withCurrentUser(InRoomView);
InRoomView = withCurrentRoom(InRoomView);
InRoomView = withPlayers(InRoomView);
InRoomView = withSubmissions(InRoomView);
InRoomView = withJGameData(InRoomView);

export default InRoomView;
