import React, { Component } from "react";
// import CanvasDraw from "react-canvas-draw";
import PropTypes from "prop-types";
import _ from "lodash";

import { userShape, submissionShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/Scoreboard/Scoreboard.scss";

class ScoreboardRow extends Component {
  static propTypes = {
    player: userShape.isRequired,
    points: PropTypes.number.isRequired,
    shadowPoints: PropTypes.number.isRequired,
  };

  render() {
    const { player, points, shadowPoints } = this.props;

    //<CanvasDraw
    //              hideGridX
    //              hideGridY
    //              saveData={player.image_blob}
    //              disabled
    //              canvasWidth={150} // This is the min allowed width
    //              canvasHeight={150} // This is the min allowed height
    //            />

    return (
      <div className="scoreboard-row">
        <div className="scoreboard-player-name">
          {player.registered_name || player.id}
          <div className="scoreboard-drawn-name"></div>
        </div>
        <div className="scoreboard-player-values">
          <div className="scoreboard-player-points">{points}</div>
          <div className="scoreboard-player-shadow-points">
            ({shadowPoints})
          </div>
        </div>
      </div>
    );
  }
}

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
    const { players } = this.props;

    const playersWithScores = _.mapValues(players, (player) => {
      const { points, shadowPoints } = this.getScoresForPlayer({
        userId: player.id,
      });
      const playerWithScores = { ...player, points, shadowPoints };
      return playerWithScores;
    });

    const scoreboardRows = _(playersWithScores)
      .values()
      .orderBy("points")
      .map((p) => (
        <ScoreboardRow
          player={p}
          points={p.points}
          shadowPoints={p.shadowPoints}
          key={p.id}
        />
      ))
      .value();

    return <div className="scoreboard">{scoreboardRows}</div>;
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
        // Add or subtract the money if correct or incorrect, respectively.
        let multiplier = 0;
        if (submission.graded_as === "correct") {
          multiplier = 1;
        } else if (submission.graded_as === "incorrect") {
          multiplier = -1;
        }
        const scoreChange = clue.money * multiplier;

        // Only affect real points if not a fake guess.
        if (!submission.is_fake_guess) {
          points += scoreChange;
        }
        // Always affect shadow points.
        shadowPoints += scoreChange;
      }
    });
    return { points, shadowPoints };
  };
}

Scoreboard = withCurrentUser(Scoreboard);
Scoreboard = withPlayers(Scoreboard);
Scoreboard = withSubmissions(Scoreboard);
Scoreboard = withJGameData(Scoreboard);

export default Scoreboard;
