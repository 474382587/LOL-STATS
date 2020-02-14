// imports
const express = require('express');
const axios = require('axios');
const config = require('config');
const cors = require('cors');
const serverless = require("serverless-http");
const router = express.router()
const app = express();

// Enable CORS
app.use(cors());
app.use('./netlify/functions/api', router)
const key = config.get('league');

const port = process.env.PORT || 5000;

app.get('/:summoner', async (request, response) => {
    console.log(request.params);
    const { summoner } = request.params;
    // const summoner = 'jerkjoe';
    try {
        const res = await axios.get(
            `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summoner}?api_key=${key}`
        );
        // response.json(res.status);
        if (res.data) {
            const { accountId } = res.data;
            console.log(accountId);
            try {
                const games = await axios.get(
                    `https://na1.api.riotgames.com/lol/match/v4/matchlists/by-account/${accountId}?endIndex=5&api_key=${key}`
                );
                // console.log(games.data.matches);
                if (games.data) {
                    const matches = games.data.matches.map(
                        match => match.gameId
                    );
                    // console.log(matches);

                    if (matches.length > 0) {
                        var results = [];
                        matches.forEach(match => {
                            try {
                                const promise = axios.get(
                                    `https://na1.api.riotgames.com/lol/match/v4/matches/${match}?api_key=${key}`
                                );
                                results.push(promise);
                            } catch (err) {
                                return response.status(404).json({
                                    msg: err.message
                                });
                            }
                        });

                        var matchResults = await Promise.all(results);
                        console.log(matchResults);

                        response.json({
                            matchResults: matchResults.map(e => e.data)
                        });
                    } else {
                        // return null
                        return res.status(404).json({
                            no_match: true
                        });
                    }
                } else {
                    console.error('Exception happened');
                    res.status(400).json({
                        msg: 'Exception happened'
                    });
                }
            } catch (err) {
                return response.status(404).json({
                    msg: err.message
                });
            }
        } else {
            console.error('Exception happened');
            res.status(400).json({
                msg: 'Exception happened'
            });
        }
    } catch (err) {
        // console.log(err);
        return response.status(404).json({
            round: '1',
            msg: err.message
        });
    }
});

// app.listen(port, () => {
//     console.log(`Server starts at port ${port}`);
// });


module.exports = app;
module.exports.handler = serverless(app);