CREATE DATABASE conftracker;
USE conftracker;

CREATE TABLE IF NOT EXISTS conferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mongodbId VARCHAR(100),
  name VARCHAR(150),
  startDate BIGINT,
  endDate BIGINT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  url VARCHAR(250),
  cfpDate BIGINT,
  cfpUrl VARCHAR(250),
  twitter VARCHAR(100),
  relationshipGoal INT,
  attendeeGoal INT,
  overview TEXT,
  slkLink VARCHAR(250),
  regionId INT,
  travelCovered TINYINT,
  lodgingCovered TINYINT
);

CREATE TABLE IF NOT EXISTS eventSources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100)
);

INSERT INTO eventSources(source) VALUES("Evangelism");
INSERT INTO eventSources(source) VALUES("Ambassador - External");
INSERT INTO eventSources(source) VALUES("Ambassador - Internal");

CREATE TABLE IF NOT EXISTS eventTypes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(100)
);

INSERT INTO eventTypes(type) VALUES("Conference");
INSERT INTO eventTypes(type) VALUES("Meetup");
INSERT INTO eventTypes(type) VALUES("Online Meetup");
INSERT INTO eventTypes(type) VALUES("Online Course");
INSERT INTO eventTypes(type) VALUES("Other");

CREATE TABLE IF NOT EXISTS meetups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mongodbId VARCHAR(100),
  meetupUrlName VARCHAR(150),
  suggestedDateStart BIGINT,
  suggestedDateEnd BIGINT,
  name VARCHAR(150),
  location VARCHAR(150),
  status VARCHAR(25),
  userId INT,
  attendeeGoal INT,
  startDate BIGINT,
  talkId INT,
  regionId INT
);

CREATE TABLE IF NOT EXISTS regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(100),
  roadmapValue VARCHAR(100)
);

INSERT INTO regions(region, roadmapValue) VALUES("Americas", "AMERICAS");
INSERT INTO regions(region, roadmapValue) VALUES("EMEA", "EMEA");
INSERT INTO regions(region, roadmapValue) VALUES("APAC", "APAC");
INSERT INTO regions(region, roadmapValue) VALUES("Global", "Global");

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conferenceId INT,
  userId INT,
  impressions TEXT,
  developersReached INT,
  relations INT,
  notes TEXT,
  meetupId INT,
  eventName VARCHAR(100),
  eventDate BIGINT,
  typeId INT,
  sourceId INT,
  regionId INT
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  talkId INT,
  userId INT,
  status VARCHAR(25),
  conferenceId INT
);

CREATE TABLE IF NOT EXISTS talks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  userId INT,
  last_modified BIGINT,
  abstract TEXT,
  notes TEXT,
  mongodbId VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auth0Id VARCHAR(50),
  name VARCHAR(100),
  picture VARCHAR(255),
  mongodbId VARCHAR(100),
  bio MEDIUMTEXT,
  communityUsername VARCHAR(100),
  email VARCHAR(250)
);
