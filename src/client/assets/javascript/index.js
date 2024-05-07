// The store will hold all information needed globally
let store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
  segments: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

/**
 * @description Render tabs for tracks and racers by calling:
 * getTracks, renderTrackCards, getRacers, renderRacerCards, renderAt
 */
async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt('#tracks', html);
    });
    getRacers().then((racers) => {
      const html = renderRacerCards(racers);
      renderAt('#racers', html);
    });
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message);
    console.error(error);
  }
}

/**
 * @description Setup click handlers for tabs: tracks, racers, submit create race, acceleration, -
 * by calling: handleSelectTrack, handleSelectRacer, handleCreateRace, handleAccelerate
 */
function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;

      //race track form field
      if (target.matches('.card.track')) {
        handleSelectTrack(target);
      }
      //Expand the click field to text
      if (target.parentElement.matches('.card.track')) {
        handleSelectTrack(target.parentElement);
      }

      //racer form field
      if (target.matches('.card.racer')) {
        handleSelectRacer(target);
      }
      //Expand the click field to text
      if (target.parentElement.matches('.card.racer')) {
        handleSelectRacer(target.parentElement);
      }

      //submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();
        handleCreateRace();
      }

      //handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate(store.race_id);
      }
    },
    false
  );
}

/**
 * @description This async function set timeout (delay) 1000 ms for function runCountdown
 * @param {number} ms
 * @returns {Promise} Promise object represents setTimeout
 */
async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}

/**
 * @description This async function controls the flow of the race, add the logic and error handling,
 * by calling: createRace, renderAt and renderRaceStartView, runCountdown, startRace, runRace
 */
async function handleCreateRace() {
  try {
    //get player_id and track_id from the store
    const { player_id, track_id } = store;
    //invoke the API call to create the race, then save the result
    if (player_id && track_id) {
      const race = await createRace(player_id, track_id)
        .then((results) => {
          //save track info (segments) to store object
          store.segments = results.Track.segments;
          return results;
        })
        .catch((err) => console.log('Problem with create Race request::', err));
      //update the store with the race id
      //for the API to work properly, the race id should be race id - 1
      store.race_id = race.ID - 1;

      //render starting UI
      renderAt('#race', renderRaceStartView(race.Track));
      //the race has been created, now start the countdown
      //call the async function runCountdown
      await runCountdown();
      //call the async function startRace
      await startRace(store.race_id);
      //call the async function runRace
      await runRace(store.race_id);
    }
  } catch (error) {
    console.log('Problem in creating race ::', error.message);
    console.error(error);
  }
}

/**
 * @description This function returns a Promise
 * @param {number} raceID Number of race from API
 * @returns {Promise} Promise object represents resolve when the race status is finished and there is a result view
 */
function runRace(raceID) {
  return new Promise((resolve) => {
    /**
     * @description This async function gets Race Info by calling getRace function every 500ms,
     * if race is in progress it updates the leaderboard by calling renderAt that is calling raceProgress,
     * if race is finished it stops the race and creates results view by calling renderAt that is calling resultsView
     */
    const getRaceInfo = async () => {
      try {
        //save to raceSituation responce from api
        const raceSituation = await getRace(raceID).then((response) => {
          return response;
        });
        //if the race info status is "in-progress", update the leaderboard
        if (raceSituation.status === 'in-progress') {
          renderAt('#leaderBoard', raceProgress(raceSituation.positions));
        }
        //else the race info status is "finished"
        else {
          clearInterval(getRaceInfoInterval); //stop the interval from repeating
          renderAt('#race', resultsView(raceSituation.positions)); //render the results view
          resolve(); //resolve the promise
        }
      } catch (error) {
        console.log('Problem with getting Race Info ::', error.message);
        console.error(error);
      }
    };
    //set interval for calling getRaceInfo function
    const getRaceInfoInterval = setInterval(getRaceInfo, 500);
  }).catch((err) => console.log('Problem with getting Race Info ::', err));
}

/**
 * @description This async function runs Countdown by calling delay function
 * @returns {Promise} Promise object represents resolve by calling udpateCountdown
 */
async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;
    return new Promise((resolve) => {
      /**
       * @description Adds timer countdown to the page and stops setInterval method
       */
      const udpateCountdown = () => {
        //run this DOM manipulation to decrement the countdown for the user
        document.getElementById('big-numbers').innerHTML = --timer;
        //if the countdown is done, clear the interval, resolve the promise
        if (timer === 0) {
          clearInterval(intervalBeforeStart);
          resolve();
        }
      };

      //using setInterval method to count down once per second
      const intervalBeforeStart = setInterval(udpateCountdown, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

/**
 * @description Handles selected Racer
 * @param {object} target Target object
 */
function handleSelectRacer(target) {
  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }
  //add class selected to current target
  target.classList.add('selected');

  //save the selected racer to the store
  store.player_id = parseInt(target.id);
}

/**
 * @description Handles selected track
 * @param {object} target Target object
 */
function handleSelectTrack(target) {

  //remove class selected from all track options
  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }
  //add class selected to current target
  target.classList.add('selected');

  //save the selected track id to the store
  store.track_id = parseInt(target.id);
}

/**
 * @description Calls accelerate function that invokes API call to accelerate
 * @param {number} raceID race number from API
 */
function handleAccelerate(raceID) {
  //invoke the API call to accelerate
  accelerate(raceID);
}

// HTML VIEWS ------------------------------------------------

/**
 * @description Creates HTML code for Racer cards
 * @param {array} racers Array of Objects (racers)
 * @returns {string} HTML code using call to renderRacerCard function
 */
function renderRacerCards(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join('');

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

/**
 * @description Creates HTML code for Racer card
 * @param {object} racer Object of racer
 * @returns {string} HTML code
 */
function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card racer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

/**
 * @description Creates HTML code for Track cards
 * @param {array} tracks Array of Objects (tracks)
 * @returns {string} HTML code using call to renderTrackCard function
 */
function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join('');

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

/**
 * @description Creates HTML code for Track card
 * @param {object} track track object
 * @returns {string} HTML code
 */
function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

/**
 * @description Creates HTML code for countdown
 * @param {number} count
 * @returns {string} HTML code
 */
function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

/**
 * @description Creates HTML code for race start view
 * @param {object} track Object of track
 * @returns {string} HTML code
 */
function renderRaceStartView(track) {
  return `
		<header>
		<img src="/assets/images/racers.png" alt="Racers">
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

/**
 * @description Sorts objects of racers by their final position from first to last
 * @param {array} positions Array of Objects
 * @returns {string} HTML code using call to raceProgress function
 */
function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
		<img src="/assets/images/racers.png" alt="Racers">
			<h1>Race Results</h1>
		</header>
		<main id="leaderboard-dashboard">
			${raceProgress(positions)}
			<a class="button" href="/race">Start a new race</a>
		</main>
	`;
}

/**
 * @description Sorts array of objects by their position on the track
 * @param {array} positions Array of Objects
 * @returns {string} HTML code for Race Progress
 */
function raceProgress(positions) {
  //find the object with racer that player chose and add 'you'
  let userPlayer = positions.find((e) => e.id === store.player_id);
  userPlayer.driver_name += ' (you)';

  //create array with racer objects that contains final position
  let withFinalPosition = positions.filter((value) => value.final_position);
  //sort objects by final position from first to last
  withFinalPosition = withFinalPosition.sort((a, b) =>
    a.final_position > b.final_position ? 1 : -1
  );

  //create array with racer objects that not contains final position (not finished yet)
  let withoutFinalPosition = positions.filter((value) => !value.final_position);
  //sort objects by final position from last to first
  withoutFinalPosition = withoutFinalPosition.sort((a, b) =>
    a.segment > b.segment ? -1 : 1
  );

  //combine all racers in one array
  const finalResultArray = withFinalPosition.concat(withoutFinalPosition);

  let count = 1;

  /**
   * @description Calculates position on the track in percentage
   * @param {object} racer Object of racer
   * @returns {number} Position of racer on the track
   */
  const trackPositionPercentage = (racer) => {
    return parseInt((racer.segment * 100) / store.segments.length);
  };

  //if all racers on final position than renders leaderboard
  if (withFinalPosition.length === 5) {
    const results = finalResultArray
      .map((p) => {
        return `
			<tr>
				<td>
					${count++}
				</td>
				<td>
				${p.driver_name}
				</td>
				<td>
				<img class="car-icon" src="/assets/images/car${p.driver_name.slice(
          6,
          7
        )}.png" alt="car">
				</td>

			</tr>
		`;
      })
      .join('');
    return `
	
			<h2>Leaderboard</h2>
			<section id="leaderBoard">
				<table>
					<thead>
						<tr>
							<th>Position</th>
							<th>Racer</th>
							<th>Car</th>
						</tr>
					</thead>
					<tbody>
						${results}
					<tbody>
				</table>
			</section>
		
	`;
    //if race in progress than renders race dashboard
  } else {
    const results = positions
      .map((p) => {
        return `
			<div>${p.driver_name}</div>
			<div class= "race-track">
			<div class="car-road">
			<img class="car-icon" src="/assets/images/car${count++}.png" alt="car" style="position: relative;     left: ${trackPositionPercentage(
          p
        )}%; ">
			</div>
			<div class = "container-for-flag">
			<img class="flag-icon" src="/assets/images/finishflag.png" alt="car" style="position: relative;     right: 3%; z-index: -1">
			</div>
			</div>
		`;
      })
      .join('');

    return `
		<main style = "width=60vw">
			<section id="race-progress">
				${results}
			</section>
		</main>
	`;
  }
}

/**
 * @description Sets HTML code to selected element
 * @param {string} element Reference to selected element
 * @param {string} html HTML code
 */
function renderAt(element, html) {
  const node = document.querySelector(element);
  node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001';

/**
 * @description Returns object with options for fetch requests
 * @returns {Object} Object with options for fetch requests
 */
function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER,
    },
  };
}

/**
 * @description Does a fetch call to API to get tracks
 * @returns {Promise} Promise object represents response from API
 */
function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  return fetch(`${SERVER}/api/tracks`)
    .then((res) => res.json())
    .catch((err) => console.log('Problem with getTracks request::', err));
}

/**
 * @description Does a fetch call to API to get racers
 * @returns {Promise} Promise object represents response from API
 */
function getRacers() {
  // GET request to `${SERVER}/api/cars`
  return fetch(`${SERVER}/api/cars`)
    .then((res) => res.json())
    .catch((err) => console.log('Problem with getRacers request::', err));
}

/**
 * @description Does a fetch call to API to create the race
 * using options from function defaultFetchOpts
 * @param {number} player_id
 * @param {number} track_id
 * @returns {Promise} Promise object represents response from API
 */
function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => console.log('Problem with createRace request::', err));
}

/**
 * @description Does a fetch call to API  to get race info
 * @param {number} id
 * @returns {Promise} Promise object represents response from API
 */
function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  return fetch(`${SERVER}/api/races/${id}`)
    .then((res) => res.json())
    .catch((err) => console.log('Problem with getRace request::', err));
}

/**
 * @description Does a fetch call to API to start the race
 * using options from function defaultFetchOpts
 * @param {number} id
 */
function startRace(id) {
  return fetch(`${SERVER}/api/races/${id}/start`, {
    method: 'POST',
    ...defaultFetchOpts(),
  }).catch((err) => console.log('Problem with getRace request::', err));
}

/**
 * @description Does a fetch call to API to accelerate the racer
 * using options from function defaultFetchOpts
 * @param {number} id
 */
function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST',
    ...defaultFetchOpts(),
  }).catch((err) => console.log('Problem with accelerate request::', err));
}
