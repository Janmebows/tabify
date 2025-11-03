# Tabify

A small tool to open tabs automatically while listening to music.
Designed to streamline play-along sessions.

## Setup
## Installation

These runs on
[nodejs](http://www.nodejs.org/download/). Their website explains how nodejs is installed.

Once installed, clone this repository and install its dependencies running:

```bash
npm install
```
## Settings
The application is configured via the config.js file.
The configuration includes:
```bash
OPEN_COMMAND # Command to run on CLI for opening tabs. A safe value on linux is xdg-open
TAB_DIRECTORY # Parent-most Directory tab files are found in
```

## Running

The application can now be run with

```bash
npm start
```

The application will run within the console, listening in to any media playing on your machine.
When a new song is played, it will attempt to find a tab in the tabs folder, and open it in your tab software.


## Notes / Caveats:

Tab-names are assumed to follow the naming convention of `artist - songname.extension`.

The filesystem is checked eagerly for tabs. This will reduce runtime I/O latency. 
If new tabs are fetched/installed, the application will have to be re-run.

While the TAB_DIRECTORY is validated immediately, the OPEN_COMMAND is not validated, just executed when a tab is found with the path to the tab file as the only argument.
E.g. if your OPEN_COMMAND was 'xdg-open', your tabs folder is '/path/to/tabs'  and the tab 'tab-name.gp' is found, then the executed command will be:
`xdg-open '/path/to/tabs/tab-name.gp'`


The application currently will not gracefully handle file names which include inverted commas: `'`.
Special characters, and songs with multiple artists may also lead to inconsistent results.


