import React, { Component } from "react";
import PropTypes from "prop-types";

import { userShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";
import RoomUpdateChecker from "background-tasks/room-update-checker";

import Loading from "components/Loading/Loading";
import HostView from "components/HostView/HostView";
import PlayerView from "components/PlayerView/PlayerView";

import "components/InRoomView/InRoomView.scss";

class InRoomView extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    /* supplied by withPlayers */
    fetchPlayers: PropTypes.func.isRequired,
    /* supplied by withSubmissions */
    fetchSubmissions: PropTypes.func.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
    fetchJGameData: PropTypes.func.isRequired,
  };

  UPDATE_CHECK_INTERVAL_sec = 1;

  /* Lifecycle methods. */

  render() {
    const { currentUser, jGameData } = this.props;

    const showLoading = !jGameData;
    const showHostView = Boolean(currentUser.is_host && jGameData);
    const showPlayerView = Boolean(!currentUser.is_host && jGameData);

    return (
      <div className="in-game">
        {showLoading && <Loading />}
        {showHostView && <HostView />}
        {showPlayerView && <PlayerView />}
      </div>
    );
  }

  componentDidMount() {
    const { fetchPlayers, fetchSubmissions, fetchJGameData } = this.props;

    fetchPlayers();
    fetchSubmissions();
    fetchJGameData();

    RoomUpdateChecker.loop();
  }
}

InRoomView = withCurrentUser(InRoomView);
InRoomView = withPlayers(InRoomView);
InRoomView = withSubmissions(InRoomView);
InRoomView = withJGameData(InRoomView);

export default InRoomView;
