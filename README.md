Back-end part of "Three Frontend Video" project.

The main task of the back-end project is to form database with best Front-end videos and send it to the web-page for publication. New videos are added to the project site every day, so a junior developer can watch three specially selected front-end videos daily. (The site is already written in React, below is a link to the project's Github).

The list of videos is formed on the basis of YouTube channels, from which the most popular videos are selected by web page parsing (the main selection criterion: the ratio of the number of video views to the average for a set period). All parsing and testing parameters can be edited in the config file.

Also, this project parses not only data about the video for publication, but also information about the channel itself when adding it to the database and populates it to videos database.

The following technologies were used for the project.

- Node.js
- Express to create a server
- Router for creating modules
- Puppeteer for parsing
- built-in Url module for working with links
- Mongo database for data storage
- Mongoose for database management and schemas
- Eslint for code control with Airbnb plugin

Special attention was paid to the project structure (file structure, variable and function names, code modularity, comments in the code), so that later it would be easier to continue developing the project in a team with other developers.

Prospects for the development of the project have three steps:

- Code refactoring to improve readability and performance + including of testing and enhanced validation of incoming data.
- Synchronization data with the channel in Telegram, where it can automatically add videos three times a day.
- Creation of websites and Telegram channels on any topic of interest using this project as a base.

The development of the product concept, architecture, writing the front-end and back-end part was done by Igor Drogaitsev.

Link to the Frontend part of the project:
https://github.com/MisterDROG/Three-Frontend-Videos-React
