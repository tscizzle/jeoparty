import React, { Component } from "react";
import PropTypes from "prop-types";

import { userShape, roomShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
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
    const { currentRoom, fetchCurrentRoom, fetchJGameData } = this.props;

    const { id: room_id, source_game_id } = currentRoom;
    fetchJGameData({ sourceGameId: source_game_id });

    // TODO: do the URL part in api.js, using the host/origin variable.
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

        default: {
          break;
        }
      }
    };
  }
}

InRoomView = withCurrentUser(InRoomView);
InRoomView = withCurrentRoom(InRoomView);
InRoomView = withJGameData(InRoomView);

export default InRoomView;
