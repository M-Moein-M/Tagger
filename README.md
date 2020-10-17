# Tagger

## Intro

An application for tagging images or notes or other entities only with their unique ID. The demo of project can be seen below. Each box represents the item you want to tag. Given an item ID will return the tags related to that ID and given a tag will return all the ID's related to that tag.

![DEMO](https://i.ibb.co/JncZzHW/tagging-project.png)

## Tagger initialization

For storing tags and items related to them, we need a database. Leaving this to the module user to implement the functions that are related to storing and changing from database. So the users can use any database they like but they should do some dirty work to make the functions for Tagger to work with. And for those users that don't have any opinion of databases, Tagger will implement an default database that they can determine once they create a Tagger object.

## Tagger APIs
