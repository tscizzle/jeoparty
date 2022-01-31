import React, { Component } from "react";
import CanvasDraw from "react-canvas-draw";
import PropTypes from "prop-types";
import _ from "lodash";

import { userShape, submissionShape, jGameDataShape } from "prop-shapes";
import withCurrentUser from "state-management/state-connectors/with-current-user";
import withPlayers from "state-management/state-connectors/with-players";
import withSubmissions from "state-management/state-connectors/with-submissions";
import withJGameData from "state-management/state-connectors/with-j-game-data";

import "components/Scoreboard/Scoreboard.scss";

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
                canvasWidth={150} // This is the min allowed width
                canvasHeight={150} // This is the min allowed height
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

export default Scoreboard;
