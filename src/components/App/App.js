import React, { Component } from "react";
import PropTypes from "prop-types";

import { setBrowserIdCookie } from "misc-helpers";

import { userShape, roomShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import LobbyView from "components/LobbyView/LobbyView";
import InRoomView from "components/InRoomView/InRoomView";

import "components/App/App.scss";

class App extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape,
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape,
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    typedRoomCode: "",
    roomCodeError: {
      message: null,
      timeoutId: null,
    },
  };

  /* Lifecycle methods. */

  render() {
    const { currentUser, currentRoom } = this.props;

    const showLoading = !currentUser;
    const showLobbyView = currentUser && !currentRoom;
    const showInRoomView = currentUser && currentRoom;

    return (
      <div className="app">
        {showLoading && <div>Loading…</div>}
        {showLobbyView && <LobbyView />}
        {showInRoomView && <InRoomView />}
      </div>
    );
  }

  componentDidMount() {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    setBrowserIdCookie();

    fetchCurrentUser();
    fetchCurrentRoom();
  }

  /* Helpers. */

  onChangeTypedRoomCode = (evt) => {
    this.setState({ typedRoomCode: evt.target.value.toUpperCase() });
  };
}

App = withCurrentUser(App);
App = withCurrentRoom(App);

export default App;
