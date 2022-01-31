import React, { Component } from "react";
import CanvasDraw from "react-canvas-draw";
import PropTypes from "prop-types";
import _ from "lodash";

import api from "api";

import {
  userShape,
  roomShape,
  submissionShape,
  jGameDataShape,
} from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withCurrentRoom from "state-management/state-connectors/with-current-room";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import JGameDisplay from "components/JGameDisplay/JGameDisplay";
import jeopardyBackground from "assets/jeopardy_background.jpg";

import "components/HostView/HostView.scss";

class LobbyView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withPlayers */
    players: PropTypes.objectOf(userShape),
  };

  state = {
    isLoadingStartingGame: false,
  };

  /* Lifecycle methods. */

  render() {
    const { players } = this.props;

    const playerList = _(players)
      .values()
      .map((player) => (
        <div key={player.id}>{player.registered_name || player.id}</div>
      ))
      .value();

    const canStartGame = playerList.length > 0;

    return (
      <div className="lobby-view">
        <div className="player-list">{playerList}</div>
        <button onClick={this.startGame} disabled={!canStartGame}>
          Start Game
        </button>
      </div>
    );
  }

  /* Helpers. */

  startGame = () => {
    const { currentRoom, fetchCurrentRoom } = this.props;

    const { id: room_id } = currentRoom;

    this.setState({ isLoadingStartingGame: true }, () => {
      api
        .startGame({ roomId: room_id })
        .then(() => {
          return fetchCurrentRoom();
        })
        .then(() => {
          this.setState({ isLoadingStartingGame: false });
        });
    });
  };
}

LobbyView = withCurrentRoom(LobbyView);
LobbyView = withPlayers(LobbyView);

class HostControls extends Component {
  static propTypes = {
    /* supplied by withCurrentUser*/
    fetchCurrentUser: PropTypes.func.isRequired,
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    fetchCurrentRoom: PropTypes.func.isRequired,
  };

  state = {
    isLoadingLeavingRoom: false,
  };

  /* Lifecycle methods. */

  render() {
    const { currentRoom } = this.props;
    const { isLoadingLeavingRoom } = this.state;

    return (
      <div className="host-controls">
        <label>ROOM CODE</label>
        <b className="room-code">{currentRoom.room_code}</b>
        <button className="leave-room-button" onClick={this.leaveRoom}>
          Leave Room
        </button>
        {isLoadingLeavingRoom && <div>Loading…</div>}
      </div>
    );
  }

  /* Helpers. */

  leaveRoom = () => {
    const { fetchCurrentUser, fetchCurrentRoom } = this.props;

    this.setState({ isLoadingLeavingRoom: true }, () => {
      api
        .leaveRoom()
        .then(() => {
          return Promise.all([fetchCurrentUser(), fetchCurrentRoom()]);
        })
        .then(() => {
          this.setState({ isLoadingLeavingRoom: false });
        });
    });
  };
}

HostControls = withCurrentUser(HostControls);
HostControls = withCurrentRoom(HostControls);

class Scoreboard extends Component {
  static propTypes = {
    /* supplied by withCurrentUser */
    currentUser: userShape.isRequired,
    /* supplied by withPlayers */
    players: PropTypes.objectOf(userShape),
    /* supplied by withSubmissions */
    submissions: PropTypes.objectOf(submissionShape),
    /* supplied by withJGameData */
    jGameData: jGameDataShape.isRequired,
  };

  /* Lifecycle methods. */

  render() {
    const { currentUser, players } = this.props;
    const playersWithScores = _.mapValues(players, (player) => {
      const { points, shadowPoints } = this.getScoresForPlayer({
        userId: player.id,
      });
      const playerWithScores = { ...player, points, shadowPoints };
      return playerWithScores;
    });

    const scoresList = _(playersWithScores)
      .values()
      .orderBy("points")
      .map((p) => (
        <div className="scoreboard-row" key={p.id}>
          <div className="scoreboard-player-name">
            {p.registered_name || p.id}
            <div className="scoreboard-drawn-name">
              <CanvasDraw
              hideGridX
              hideGridY
              saveData={p.image_blob}
              disabled
              canvasWidth= {150} // This is the min allowed width
              canvasHeight= {150} // This is the min allowed height
              />
            </div>
          </div>
          <div className="scoreboard-player-values">
            <div className="scoreboard-player-points">{p.points}</div>
            <div className="scoreboard-player-shadow-points">
              ({p.shadowPoints})
            </div>
          </div>
        </div>
      ))
      .value();

    return <div className="scoreboard">{scoresList}</div>;
  }

  /* Helpers. */

  getScoresForPlayer = ({ userId }) => {
    const { submissions, jGameData } = this.props;

    const { clues } = jGameData;

    const submissionsForPlayer = _.pickBy(submissions, { user_id: userId });

    let points = 0;
    let shadowPoints = 0;
    _.each(submissionsForPlayer, (submission) => {
      const clue = clues[submission.clue_id];
      if (clue.money) {
        if (submission.is_correct === 1) {
          // Always add to shadow points.
          shadowPoints += clue.money;
          // Only add to real points if not a fake guess.
          if (!submission.is_fake_guess) {
            points += clue.money;
          }
        }
      }
    });
    return { points, shadowPoints };
  };
}

Scoreboard = withCurrentUser(Scoreboard);
Scoreboard = withPlayers(Scoreboard);
Scoreboard = withSubmissions(Scoreboard);
Scoreboard = withJGameData(Scoreboard);

class HostView extends Component {
  static propTypes = {
    /* supplied by withCurrentRoom */
    currentRoom: roomShape.isRequired,
    /* supplied by withJGameData */
    jGameData: jGameDataShape,
  };

  render() {
    const { currentRoom, jGameData } = this.props;

    const showLoading = !jGameData;
    const showGame = Boolean(currentRoom.has_game_been_started && jGameData);

    return (
      <div
        className="host-view"
        style={{ backgroundImage: `url(${jeopardyBackground})` }}
      >
        {showLoading && <div>Loading…</div>}
        {showGame ? <JGameDisplay /> : <LobbyView />}
        {showGame && <Scoreboard />}
        <HostControls />
      </div>
    );
  }
}

HostView = withCurrentRoom(HostView);
HostView = withJGameData(HostView);

export default HostView;
