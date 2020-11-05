# Tagger

## Intro

An application for tagging images or notes or other entities only with their unique ID. The demo of project can be seen below. Each box represents the item you want to tag. Given an item ID will return the tags related to that ID and given a tag will return all the ID's related to that tag.

![DEMO](https://i.ibb.co/JncZzHW/tagging-project.png)

# Tagger initialization

For storing tags and items related to them, we need a database. Leaving this to the module user to implement the functions that are related to storing and changing from database. So the users can use any database they like but they should do some dirty work to make the functions for Tagger to work with(Tagger might implement an default database for users).

## User dirty work

```javascript
const tagger = new Tagger(insertDoc, updateDoc, getDocByID, tagUniqueIdentifier, itemUniqueIdentifier);
```

As we told, user must implement the functions below for initializing the Tagger.

- **insertDoc** is the function that will be used for saving the tags clusters(the whole tags and items) to the database. The implementation should be as follows:

```javascript
function insertDoc(newDocument) {
  // your code which saves the newDocument into the database
}
```

- **updateDoc** is used for updating a specific document(cluster) in the database. The whole document will be sent to this function which means some of its values might not changed at all.

```javascript
function updateDoc(docID, document) {
  // your code which updates the document with the id of docID with the new values in document.
}
```

- **getDocByID** (as the name implies)is the function which returns the document with the requested document(id). The docID is actually the clusterID for one of the clusters.

```javascript
function getDocByID(id) {
  // your code which returns requested doc(cluster) that stored in database using the insertDoc function that was mentioned above.
}
```

- **tagUniqueIdentifier** and **itemUniqueIdentifier** are just some namings for the how the identifiers will be saved in the cluster. If you want to use the clusters that Tagger saves in the database, this might be useful. The default values are 'id'. if you pass something else like 'name' then the tags and items will be something like this:

```javascript
{
  "root": false,
  "childrenTags": [],
  "tagName": "Drama",
  "items": [
    "1000"
  ],
  "name": "110"   // this is the identifier of this tag with property name of 'name'
}
```

instead of this:

```javascript
{
  "root": false,
  "childrenTags": [],
  "tagName": "Drama",
  "items": [
    "1000"
  ],
  "id": "110"   // this is the identifier of this tag with property name of 'id'
}
```

---

## Create new cluster

The **clusters** are the main structure for saving and keep track of the items and tags. On creating new cluster you can pass the cluster id as you like. This id is used later for saving and retrieving this specific cluster. If the id is not provided, then Tagger will generate a random string and send it back as return value of the function which is NOT guaranteed to be unique because it's just a random number generator.

```javascript
// Initializing Tagger
const tagger = new Tagger(insertDoc, updateDoc, getDocByID, tagUniqueIdentifier, itemUniqueIdentifier);

// Unique id for cluster
const uniqueClusterID = 'u0n0i0q0u0e';
// Create new cluster with provided id
await tagger.createNewCluster(uniqueClusterID);

// Create new cluster without any provided id
// clusterID is the random string generated by Tagger
const clusterID = await tagger.createNewCluster();
```

---

## Insert new tag

This function is used for creating new tags in the cluster.

**clusterID** determines which cluster is new tag inserted to.

**tagName** is the name of the new tag. This will be used for printing the cluster later on.

**tagID** is a unique identifier for the new tag. This identifier is used almost for all of the functions related to tags and items.

**parent** is the id of the tag that will be the parent of new tag.

**root** is a boolean which indicates whether new tag is root or not. Incase of inserting new root, **parent** should be passed as **null** and **root** should be passed as **true**

```javascript
// inserting new root
clusterID = 'yourClusterID';
tagName = 'RootTagName';
tagID = 'RootTagID';
parent = null; // pass null as parent when inserting new root
root = true; // pass true when inserting new root

// inserting new tag
clusterID = 'yourClusterID';
tagName = 'tagName';
tagID = 'tagID';
parent = 'parentID';
root = false;
await tagger.insertTag(clusterID, tagName, tagID, parent, root);
```

---

## Delete tag

Call this function for deleting any tag specified by its id and its cluster.

```javascript
await tagger.deleteTag(clusterID, tagIdToDelete);
```

---

## Insert new item

The first parameter is the cluster id.

The second parameter is the item id. the only way to specify the items to Tagger is with their id and the value of the item and other properties of the item (of course) is not Tagger's to manage.

The third parameter is the tag id that new item is gonna be attached to. If the tag has any children tags(sub tags), new item will be added to those as well.

```javascript
await tagger.insertItem(clusterID, itemID, tagIdToAttachTo);
```

**Note** that inserting new item to a specific tag will add the item to the tag and all of its parents. For example if tagA is parent of tagB and tagC, on inserting new item to tagB, the inserted item will be added to items of tagB and tagA(parent)

---

## Delete item

Removing item itself and update all the tags so that all the references to the item are cleared.

Two arguments are needed. The **clusterID** is the id of the cluster we want to remove the item from. The **itemID** is the id of the item that is going to be removed.

```javascript
await tagger.deleteItem(clusterID, itemID);
```

---

## Retrieve tags

This function is used to get all the tags related to an specific item.

```javascript
const retTags = await tagger.retrieveTags(clusterID, itemID);
```

---

## Retrieve items

This function is used to get all the items related to an specific tag.

```javascript
const retItems = await tagger.retrieveItems(clusterID, tagID);
```

---

## Retrieve children of a tag

This function is used to get children of a specific tag. The function wil return the tag's children as an array of their IDs.

```javascript
const children = await tagger.retrieveChildrenTags(clusterID, tagID);
```

---

## Print cluster

A naive way to display the cluster tags level by level. It may help for debugging but it definitely can be improved.

```javascript
await tagger.printTags(clusterID);
```
