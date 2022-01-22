import React, { Component } from "react";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";
import { randomID, setBrowserIdCookie } from "misc-helpers";

import { userShape, roomShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";

import LobbyView from "components/LobbyView/LobbyView";
import HostView from "components/HostView/HostView";
import PlayerView from "components/PlayerView/PlayerView";

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
    const showHostView = currentUser && currentRoom && currentUser.is_host;
    const showPlayerView = currentUser && currentRoom && !currentUser.is_host;

    return (
      <div className="app">
        {showLoading && <div>Loading…</div>}
        {showLobbyView && <LobbyView />}
        {showHostView && <HostView />}
        {showPlayerView && <PlayerView />}
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
