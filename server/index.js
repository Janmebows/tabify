const Fuse = require('fuse.js')
const express = require('express')
const request = require('request');
const dotenv = require('dotenv');
const child_process = require('child_process');
const fs = require('fs');
const path = require("node:path");
const POLL_DELAY_MS = 10_000;
let access_token = ''
dotenv.config()

const port = process.env.SERVER_PORT;
const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET
const open_tab_command = process.env.OPEN_COMMAND;
const tab_directory = process.env.TAB_DIRECTORY;
const spotify_redirect_uri = `http://localhost:${process.env.PORT}/auth/callback`

if (!fs.existsSync(tab_directory)) {
    console.error('Could not find tab directory on system', tab_directory);
    return -1;
}

//NOTE: it may be worth doing this on-demand, instead of loading all at startup
const tabs = fs.readdirSync(tab_directory).map(tab => {
    const [artist, name] = tab.split(" - ");
    return {
        file: tab,
        artist,
        name
    }
})

const fuse = new Fuse(tabs, {
    isCaseSensitive: false,
    shouldSort: true,
    // Assume song titles should be really close to the tab title.
    distance: 10,
    includeScore: true,
    keys: [
        "artist",
        "name"
    ]
});

const generateRandomString = function (length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const app = express();

app.get('/auth/login', (req, res) => {
    console.log('Hit /auth/login')
    const scope = "streaming user-read-email user-read-private user-read-playback-state"
    const state = generateRandomString(16);

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: spotify_redirect_uri,
        state: state
    })

    res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
})

app.get('/auth/callback', (req, res) => {
    console.log('Hit /auth/callback');
    const code = req.query.code;

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: spotify_redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token;
            console.log('Posted to token api, redirecting to /')
            res.redirect('/')
            pollSong();
        } else {
            console.log('Received error on auth request', error, response, body);
        }
    });

})

app.get('/auth/token', (req, res) => {
    console.log('Hit /auth/token')
    res.json({access_token: access_token})
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})


let poll_song_timeout;
let old_song_name = '';
let old_song_artists = [];
/// TODO:
///  Spotify does not allow any sort of continuous, socketed connection to listen to media changes.
///  It is somewhat possible with the web-player, but this requires the web app to be *hosting* the music.
///  Instead we poll the spotify api to find out what the user is listening to at a fixed rate.
///  In theory we could pay attention to the song they are listening to and only poll when the song ends
///  But this wouldn't account for skipping, rewind, fast-forward, etc.
///  Hence, we blindly poll.
const pollSong = () => {
    console.log('Polling for currently playing track');
    fetch("https://api.spotify.com/v1/me/player", {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + access_token
        },
    }).then(response => {
        //TODO: token refreshing
        // Handle bad responses (e.g. 401)
        // Gracefully handle a 204 (when music isn't playing)
        if (!response.ok) {
            console.log('Received bad poll-song response', response);
        }
        return response.json()
    }).then(json => {
        const {item} = json;
        if (item) {
            const {name, artists} = item;
            console.log('Listening to', name, artists.map(artist => artist.name));
            // check if this is a new song
            if (old_song_name !== name) {
                //N.b. assuming that the name is sufficient (this is definitely not always true)
                // TODO: check that the artists have changed too.

                // the song changed!

                // Assume that the tab name contains exactly 1 artist, and use a logical or to search for them.
                const results = fuse.search({
                    $and: [
                        {
                            $or: artists.map(artist => {
                                return {artist: artist.name}
                            })
                        },
                        {name: name}
                    ]
                })


                // TODO: how do we handle multiple matches?
                //  Right now we just take the first one by virtue of using collection.find
                //  In theory there could be a more correct or 'better' tab based on the artist etc.
                const tab = results.length > 0 ? results[0].item.file : null;
                if (tab) {
                    console.log('Opening tab', tab);
                    // TODO: this line will break if a file contains an inverted comma
                    child_process.exec(`${open_tab_command} '${path.join(tab_directory, tab)}'`, (error, stdout, stderr) => {
                        if (error) {
                            // TODO: can we handle errors at all here?
                            console.error(`exec error: ${error}`);
                            console.log(`stdout: ${stdout}`);
                            console.error(`stderr: ${stderr}`);
                        }
                    });
                } else {
                    // Can we do anything else here?
                    console.log('No tab found for song', name, artists.map(artist => artist.name));
                }
            } else {
                console.log('Song has not changed');
            }
            old_song_name = name;
            old_song_artists = artists;
        }
    }).catch(err => {
        console.error('Error in song polling', err);
    }).finally(() => {
        //TODO: this is probably a little too aggressive. If there is some sort of network error, this will keep hitting the API
        clearTimeout(poll_song_timeout);
        poll_song_timeout = setTimeout(pollSong, POLL_DELAY_MS);
    });
}
child_process.exec(`xdg-open http://localhost:${process.env.PORT}`)