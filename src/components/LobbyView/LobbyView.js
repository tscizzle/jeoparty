import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import "components/LobbyView/LobbyView.scss";

class LobbyView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    typedRoomCode: "",
    roomCodeError: null,
    isLoadingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const { typedRoomCode, roomCodeError } = this.state;

    return (
      <div className="app">
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
        <div>
          <h1>Create Room</h1>
          <button onClick={this.createRoom}>Create</button>
        </div>
      </div>
    );
  }

  /* Helpers. */

  onChangeTypedRoomCode = (evt) => {
    this.setState({ typedRoomCode: evt.target.value.toUpperCase() });
  };

  createRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    this.setState({ isLoadingRoom: true }, () => {
      api
        .createRoom()
        .then(() => {
          fetchCurrentUser();
          fetchCurrentRoom();
        })
        .then(() => {
          this.setState({ isLoadingRoom: false });
        });
    });
  };

  joinRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;
    const { typedRoomCode } = this.state;

    this.setState({ isLoadingRoom: true }, () => {
      api
        .joinRoom({ roomCode: typedRoomCode })
        .then((res) => {
          if (res.success) {
            fetchCurrentUser();
            fetchCurrentRoom();
          } else {
            this.setState({ roomCodeError: res.reason });
          }
        })
        .then(() => {
          this.setState({ isLoadingRoom: false });
        });
    });
  };
}

LobbyView = withCurrentUser(LobbyView);
LobbyView = withCurrentRoom(LobbyView);

export default LobbyView;
