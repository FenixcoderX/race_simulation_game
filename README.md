# Race Simulation Game

## Description

JavaScript (Async/Await) | HTML & CSS | Responsive Design | NodeJS | ExpressJS | game API

Web app that represents a race simulation game. 
The player needs to choose both a racer and a track to initiate the game. Once started, the player speeds up their racer by pressing an acceleration button. As the player's racer gains speed, so do the others. Meanwhile, the position of the racers on the track is constantly updated in real time. The game culminates in a results table showcasing the ranking of all players.
The app is based on Asynchronous JavaScript using Promises and Async/Await syntax to handle game processes.

## Getting Started

### Start the Server

This app uses the game engine API as binary file held in the bin folder.

To run the server, locate your operating system and run the associated command in your terminal at the root of the project.

| Your OS               | Command to start the API                                  |
| --------------------- | --------------------------------------------------------- |
| Mac                   | `ORIGIN_ALLOWED=http://localhost:3000 ./bin/server-darwin-amd64`   |
| Windows               | `ORIGIN_ALLOWED=http://localhost:3000 ./bin/server-windows-amd64.exe`   |
| Linux (Ubuntu, etc..) | `ORIGIN_ALLOWED=http://localhost:3000 ./bin/server-linux-amd64` |

Note that this process will use your terminal tab, so you will have to open a new tab and navigate back to the project root to start the front end.

#### WINDOWS USERS -- Setting Environment Variables
If you are using a windows machine:
1. `cd` into the root of the project containing data.json 
2. Run the following command to add the environment variable:

```
set DATA_FILE=./data.json
```


### Start the Frontend

```
npm install && npm start
``` 

You should be able to access http://localhost:3000.
