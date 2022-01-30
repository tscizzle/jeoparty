import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape, roomShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayersInRoom from "state-management/state-connectors/with-players-in-room";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import HostView from "components/HostView/HostView";
import PlayerView from "components/PlayerView/PlayerView";

import "components/InRoomView/InRoomView.scss";

class InRoomView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
    /* supplied by withPlayersInRoom */
    fetchPlayersInRoom: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    fetchJGameData: PropTypes.func.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { currentUser } = this.props;

    return (
      <div className="in-game">
        {currentUser.is_host ? <HostView /> : <PlayerView />}
      </div>
    );
  }

  componentDidMount() {
    const {
      currentRoom,
      fetchCurrentRoom,
      fetchPlayersInRoom,
      fetchJGameData,
    } = this.props;

    const { id: room_id, source_game_id } = currentRoom;

    fetchPlayersInRoom({ roomId: room_id });

    fetchJGameData({ sourceGameId: source_game_id });

    const eventSource = api.subscribeToRoomUpdates({ roomId: room_id });
    eventSource.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      switch (msg.TYPE) {
        case "ROOM_UPDATE": {
          fetchCurrentRoom();
          break;
        }

        case "PLAYER_JOINED_ROOM": {
          fetchPlayersInRoom({ roomId: room_id });
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
InRoomView = withPlayersInRoom(InRoomView);
InRoomView = withJGameData(InRoomView);

export default InRoomView;
