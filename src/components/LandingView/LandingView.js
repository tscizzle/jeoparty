import React, { Component } from "react";
import PropTypes from "prop-types";

import api from "api";

import { userShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import "components/LandingView/LandingView.scss";

class LandingView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    isJoiningRoom: false,
    isLoadingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const { isLoadingRoom, isJoiningRoom } = this.state;

    const landingView = (
      <div className="landing-view">
        <div>
          <button onClick={this.createRoom}>Create New Room</button>
        </div>
        <div>
          <button onClick={this.onClickJoinRoom}>Join Existing Room</button>
        </div>
        {isLoadingRoom && <div>Loading…</div>}
      </div>
    );
    return (
      <div className="landing-view-container">
        {isJoiningRoom ? <JoinRoomView /> : landingView}
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
          return Promise.all([fetchCurrentUser(), fetchCurrentRoom()]);
        })
        .then(() => {
          this.setState({ isLoadingRoom: false });
        });
    });
  };

  onClickJoinRoom = () => {
    this.setState({ isJoiningRoom: true });
  };
}

class JoinRoomView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    goBack: false,
    typedRoomCode: "",
    roomCodeError: null,
    isLoadingRoom: false,
    typedPlayerName: "",
  };

  /* Lifecycle methods. */

  render() {
    const {
      typedRoomCode,
      roomCodeError,
      isLoadingRoom,
      typedPlayerName,
      goBack,
    } = this.state;

    const joiningView = (
      <div className="joining-view">
        <div>
          <h1>Joining a Room</h1>
          <h2>ROOM CODE</h2>
          <input
            placeholder="ENTER TEXT"
            value={typedRoomCode}
            onChange={this.onChangeTypedRoomCode}
          />
          {roomCodeError && (
            <div className="room-code-error">{roomCodeError}</div>
          )}
          <h2>PLAYER NAME</h2>
          <input
            placeholder="ENTER TEXT"
            value={typedPlayerName}
            onChange={this.onChangeTypedPlayerName}
          />
        </div>
        <div>
          <button onClick={this.joinRoom}> Join Room </button>
          <button onClick={this.onClickGoBack}>Go back</button>
        </div>
        {isLoadingRoom && <div>Loading…</div>}
      </div>
    );

    return goBack ? <LandingView /> : joiningView;
  }

  /* Helpers. */

  onChangeTypedPlayerName = (evt) => {
    this.setState({ typedPlayerName: evt.target.value.toUpperCase() });
  };

  onClickGoBack = (evt) => {
    this.setState({ goBack: true });
  };

  onChangeTypedRoomCode = (evt) => {
    this.setState({ typedRoomCode: evt.target.value.toUpperCase() });
  };

  joinRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;
    const { typedRoomCode, typedPlayerName } = this.state;

    this.setState({ isLoadingRoom: true }, () => {
      api
        .joinRoom({ roomCode: typedRoomCode, nameToRegister: typedPlayerName })
        .then((res) => {
          if (res.success) {
            return Promise.all([fetchCurrentUser(), fetchCurrentRoom()]);
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

LandingView = withCurrentUser(LandingView);
LandingView = withCurrentRoom(LandingView);

JoinRoomView = withCurrentUser(JoinRoomView);
JoinRoomView = withCurrentRoom(JoinRoomView);

export default LandingView;
