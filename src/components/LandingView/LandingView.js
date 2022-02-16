import React, { Component } from "react";
// import CanvasDraw from "react-canvas-draw";

import PropTypes from "prop-types";

import api from "api";

import { userShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import Loading from "components/Loading/Loading";
import NiceButton from "components/NiceButton/NiceButton";
import NiceInput from "components/NiceInput/NiceInput";

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
    typedRoomCode: "",
    typedPlayerName: "",
    roomCodeError: null,
    isLoadingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const {
      isJoiningRoom,
      typedRoomCode,
      typedPlayerName,
      roomCodeError,
      isLoadingRoom,
    } = this.state;

    const landingView = (
      <div className="landing-view">
        <div>
          <NiceButton
            className="create-room-button"
            isPrimary={true}
            isBig={true}
            onClick={this.createRoom}
          >
            Create New Room
          </NiceButton>
        </div>
        <div>
          <NiceButton
            className="join-room-button"
            isPrimary={true}
            isBig={true}
            onClick={this.onClickJoinRoom}
          >
            Join Existing Room
          </NiceButton>
        </div>
        {isLoadingRoom && <Loading />}
      </div>
    );

    const joiningView = (
      <div className="joining-view">
        <h2>ROOM CODE</h2>
        <NiceInput
          placeholder="ROOM CODE"
          value={typedRoomCode}
          onChange={this.onChangeTypedRoomCode}
        />
        {roomCodeError && (
          <div className="room-code-error">{roomCodeError}</div>
        )}
        <h2>PLAYER NAME</h2>
        <NiceInput
          placeholder="PLAYER NAME"
          value={typedPlayerName}
          onChange={this.onChangeTypedPlayerName}
        />
        <div className="join-room-buttons-container">
          <NiceButton isPrimary={true} isBig={true} onClick={this.joinRoom}>
            Join Room
          </NiceButton>
          <NiceButton isBig={true} onClick={this.onClickGoBack}>
            Go back
          </NiceButton>
        </div>
        {isLoadingRoom && <Loading />}
      </div>
    );

    return (
      <div className="landing-view-container">
        {isJoiningRoom ? joiningView : landingView}
      </div>
    );
  }

  /* Helpers. */

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

  onChangeTypedRoomCode = (evt) => {
    this.setState({ typedRoomCode: evt.target.value.toUpperCase() });
  };

  onChangeTypedPlayerName = (evt) => {
    this.setState({ typedPlayerName: evt.target.value.toUpperCase() });
  };

  joinRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;
    const { typedRoomCode, typedPlayerName } = this.state;
    const canvasImageBlob = null; // this.saveableCanvas.getSaveData();
    this.setState({ isLoadingRoom: true }, () => {
      api
        .joinRoom({
          roomCode: typedRoomCode,
          nameToRegister: typedPlayerName,
          canvasImageBlob: canvasImageBlob,
        })
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

  onClickGoBack = (evt) => {
    this.setState({ isJoiningRoom: false });
  };
}

LandingView = withCurrentUser(LandingView);
LandingView = withCurrentRoom(LandingView);

export default LandingView;
