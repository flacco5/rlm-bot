const rp      = require(`request-promise`);
const twit    = require(`twit`);
const config  = require(`./config.js`);

var today = new Date();
var d = today.getDate();
var m = today.getMonth()+1; //January is 0!
var y = today.getFullYear();
if(d<10) {   d = '0'+d } 
if(m<10) {   m = '0'+m } 
today = y + m + d;

//sports action API connection
const actionApi = {
	url: `https://api-prod.sprtactn.co/web/v1/scoreboard/mlb?date=${today}`,
	json: true
}

//home team, away team, opening odds, and closing odds API pul
		rp(actionApi)
			.then((data) => { 

		const homeTeam  = [];  //home team name
		const awayTeam  = [];  //away team name
		const openOdds  = [];  //opening odds
		const currOdds  = [];  //current odds
		const mergRecs  = [];
		const rlmTotals = [];


		const games = data.games;

			games.forEach((games) => {
					
				games.teams.forEach((teams, i) => {
					if (games.home_team_id == games.teams[i].id) {
						homeTeam.push({home_team: games.teams[i].abbr}); 
					} else if (games.away_team_id == games.teams[i].id) {
						awayTeam.push({away_team: games.teams[i].abbr}); 
					}
				})

				games.odds.forEach((odds, i) => {
					if (games.odds[i].type == "game" && games.odds[i].book_id == "15") {
						currOdds.push({
										currAwayLine: games.odds[i].ml_away, 
										currHomeLine: games.odds[i].ml_home, 
										currAwaySpread: games.odds[i].spread_away, 
										currHomeSpread: games.odds[i].spread_home, 
										currAwayTotal: games.odds[i].total,
										currHomeTotal: games.odds[i].total,
										homeMlBets: games.odds[i].ml_home_public,
										awayMlBets: games.odds[i].ml_away_public,
										totalOverBets: games.odds[i].total_over_public,
										totalUnderBets: games.odds[i].total_under_public,
										spreadHomeBets: games.odds[i].spread_home_public,
										spreadAwayBets: games.odds[i].spread_away_public
									})
					} else if (games.odds[i].type == "game" && games.odds[i].book_id == "30") {
						openOdds.push({
										openAwayLine: games.odds[i].ml_away, 
										openHomeLine: games.odds[i].ml_home, 
										openAwaySpread: games.odds[i].spread_away, 
										openHomeSpread: games.odds[i].spread_home,
										openAwayTotal: games.odds[i].total,
										openHomeTotal: games.odds[i].total
									})
					} 
				})
			})
				
				for (i = 0; i < homeTeam.length; i++) {
					mergRecs.push({
						homeTeam: homeTeam[i].home_team, 
						awayTeam: awayTeam[i].away_team,
						currAwayLine: currOdds[i].currAwayLine,
						currHomeLine: currOdds[i].currHomeLine,
						openAwayLine: openOdds[i].openAwayLine,
						openHomeLine: openOdds[i].openHomeLine,
						currAwaySpread: currOdds[i].currAwaySpread,
						currHomeSpread: currOdds[i].currHomeSpread,
						openAwaySpread: openOdds[i].openAwaySpread,
						openHomeSpread: openOdds[i].openHomeSpread,
						currAwayTotal: currOdds[i].currAwayTotal,
						currHomeTotal: currOdds[i].currHomeTotal,
						openAwayTotal: openOdds[i].openAwayTotal,
						openHomeTotal: openOdds[i].openAwayTotal,
						homeMlBets: currOdds[i].homeMlBets,
						awayMlBets: currOdds[i].awayMlBets,
						totalOverBets: currOdds[i].totalOverBets,
						totalUnderBets: currOdds[i].totalUnderBets,
						spreadHomeBets: currOdds[i].spreadHomeBets,
						spreadAwayBets: currOdds[i].spreadAwayBets
					})
						
				}
			for (var i = 0; i < mergRecs.length; i++) { //RLM is to bet the under
				if (mergRecs[i].openHomeTotal > mergRecs[i].currHomeTotal && mergRecs[i].totalOverBets > 50) {
					rlmTotals.push({type: "Take the Under", game: `${mergRecs[i].homeTeam}vs${mergRecs[i].awayTeam}`})
				}
			} 
			for (var i = 0; i < mergRecs.length; i++) { //RLM is to bet the over 
				if (mergRecs[i].openHomeTotal < mergRecs[i].currHomeTotal && mergRecs[i].totalUnderBets > 50) {
					rlmTotals.push({type: "Take the Over", game: `${mergRecs[i].homeTeam}vs${mergRecs[i].awayTeam}`})
				}
			}
			for (var i = 0; i < mergRecs.length; i++) { //RLM is to bet spread home
				if (mergRecs[i].openHomeSpread < mergRecs[i].currHomeSpread && mergRecs[i].spreadAwayBets > 50) {
					rlmTotals.push({type: `Take ${mergRecs[i].homeTeam}`, game: `${mergRecs[i].homeTeam}vs${mergRecs[i].awayTeam}`})
				}
			}
			for (var i = 0; i < mergRecs.length; i++) { //RLM is to bet spread away
				if (mergRecs[i].openAwaySpread < mergRecs[i].currAwaySpread && mergRecs[i].spreadAwayBets > 50) {
					rlmTotals.push({type: `Take ${mergRecs[i].awayTeam}`, game: `${mergRecs[i].homeTeam}vs${mergRecs[i].awayTeam}`})
				}
			}

		const body = [];
			for (var i = 0; i < rlmTotals.length; i++) {
				body.push(`${rlmTotals[i].type} in ${rlmTotals[i].game}`)
			}
		const tweet = body.join("\n");
		//Twitter section ====================================

		var Twitter = new twit(config);

		Twitter.post('statuses/update', { 
			status: `${tweet}` 
		}, 
		function(err, data, response) {
				console.log(data.text)
			})
		delete tweet; 
	})
		.catch((err) => {
			console.log(err);
		});