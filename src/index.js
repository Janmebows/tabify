const Fuse = require("fuse.js");
const dotenv = require("dotenv");
const child_process = require("child_process");
const fs = require("fs");
const path = require("node:path");
dotenv.config();

const open_tab_command = process.env.OPEN_COMMAND;
const tab_directory = process.env.TAB_DIRECTORY;

if (!fs.existsSync(tab_directory)) {
    console.error("Could not find tab directory on system", tab_directory);
    return -1;
}

//NOTE: it may be worth doing this on-demand, instead of loading all at startup
const tabs = fs.readdirSync(tab_directory).map((tab) => {
    const [artist, name] = tab.split(" - ");
    return {
        file: tab,
        artist,
        name,
    };
});

const fuse = new Fuse(tabs, {
    isCaseSensitive: false,
    shouldSort: true,
    // Assume song titles should be really close to the tab title.
    distance: 10,
    includeScore: true,
    keys: ["artist", "name"],
});

const musicmetadata = child_process.spawn("playerctl", [
    // "-p", "spotify",
    "metadata",
    "--format",
    '{"title":"{{title}}", "artist":"{{artist}}"}',
    "-F",
]);
musicmetadata.stdout.on("data", (data) => {
    console.log(`Now playing ${data.toString()}`);
    try {
        const { title, artist } = JSON.parse(data.toString());
        // Assume that the tab name contains exactly 1 artist, and use a logical or to search for them.
        const results = fuse.search({
            $and: [{ artist: artist }, { name: title }],
        });
        // TODO: how do we handle multiple matches?
        //  Right now we just take the first one by virtue of using collection.find
        //  In theory there could be a more correct or 'better' tab based on the artist etc.
        const tab = results.length > 0 ? results[0].item.file : null;
        if (tab) {
            console.log("Opening tab", tab);
            // TODO: this line will break if a file contains an inverted comma
            child_process.exec(
                `${open_tab_command} '${path.join(tab_directory, tab)}'`,
                (error, stdout, stderr) => {
                    if (error) {
                        // TODO: can we handle errors at all here?
                        console.error(`exec error: ${error}`);
                        console.log(`stdout: ${stdout}`);
                        console.error(`stderr: ${stderr}`);
                    }
                },
            );
        } else {
            // Can we do anything else here?
            console.log("No tab found for song", title, artist);
        }
    } catch (error) {
        console.error(`Could not parse meta-data:`, error, data);
    }
});
musicmetadata.on("close", (code) => {
    console.error("Subprocess died", code);
});
musicmetadata.on("error", (err) => {
    console.error("Subprocess died", err);
});

console.log("Listening");
