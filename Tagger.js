const EventEmitter = require('events');

class Tagger extends EventEmitter {
  constructor(insertDoc, updateDoc, getDocByID, tagUniqueIdentifier = 'id', itemUniqueIdentifier = 'id') {
    super();
    this.createNewCluster = async function (clusterID) {
      try {
        // generate new cluster id incase the user didn't provide any
        if (clusterID == undefined) {
          clusterID = generateClusterID();
        }

        const cluster = {
          Tags: [],
          Items: [],
          clusterID: clusterID,
        };

        await insertDoc(cluster, cluster.clusterID);

        return clusterID;
      } catch (error) {
        const description = 'Error Description: \n\t==>Creating new cluster failed';
        this.emit('error', error, description);
      }
    };

    function generateClusterID() {
      try {
        // generate random ID
        const order = 10;
        let id = '';
        for (let i = 0, id = ''; i < order; i++) id += Math.floor(Math.random() * 60466175).toString(36);
        return id;
      } catch (error) {
        // pass the error to a caller function
        throw error;
      }
    }

    // printing tags
    this.printTags = async function (clusterID) {
      try {
        const cluster = await getDocByID(clusterID);

        let currentNode = getTag(cluster, 'root', true);
        let currentLevel = 0; // to keep track of which level are we printing ATM. Used for better looking output

        // incase of printing empty cluster
        if (!currentNode) {
          console.log('There is no tag in the cluster');
          return;
        }

        // using queue for traversing the tree level by level
        let queue = [];
        queue.push(Object.assign(currentNode, { nodeLevel: currentLevel }));

        while (queue.length > 0) {
          currentNode = queue.shift();
          if (currentNode.nodeLevel === currentLevel + 1) {
            console.log('\n');
            currentLevel++;
          }

          // avoid new line at the end of console logging
          process.stdout.write(currentNode.tagName + '\t');

          for (let i = 0; i < currentNode.childrenTags.length; i++) {
            let child = getTag(cluster, tagUniqueIdentifier, currentNode.childrenTags[i]);
            queue.push(Object.assign(child, { nodeLevel: currentLevel + 1 }));
          }
        }

        console.log('\n- - - - - - - - - - - - - - -\n');
      } catch (error) {
        const description = 'Error Description: \n\t==>Printing cluster failed';
        this.emit('error', error, description);
      }
    };

    // handling item insertion
    this.insertItems = async function (clusterID = null, itemIDs = null, tagID = null) {
      try {
        // check for valid itemIDs and tagID
        if (itemIDs === null) throw new Error('Null itemIDs');
        else if (tagID === null) throw new Error('Null TagID');
        else if (clusterID === null) throw new Error('Null clusterID');

        let cluster = await getDocByID(clusterID);

        cluster = await insertItemsToCluster(cluster, itemIDs, tagID);

        await updateDoc(cluster.clusterID, cluster);
      } catch (error) {
        const description = 'Error Description: \n\t==>Inserting new item failed';
        this.emit('error', error, description);
      }
    };

    async function insertItemsToCluster(cluster, itemIDs, tagID) {
      try {
        // keep track of each of the item's tags. This will be used to create new item
        const newItemsTags = {};

        // keep track of which tag are we processing now
        let loopTagID = tagID;

        // handling tags of the new items
        // Traversing tags tree upwards towards the root

        while (true) {
          // if reached the parent of the root(which is null) then break the while
          if (loopTagID === null) {
            break;
          }

          const tag = getTag(cluster, tagUniqueIdentifier, loopTagID);

          // add new items to list of items of the tag
          for (let itmCount = 0; itmCount < itemIDs.length; itmCount++) {
            const itemID = itemIDs[itmCount];

            // skip if item does already exists
            if (tag.items.includes(itemID)) continue;

            // insert new item to the tag
            tag.items.push(itemID);

            // list this tag for itemID
            // to insert a tag for the first time we need an initialization
            if (newItemsTags[itemID] === undefined) {
              newItemsTags[itemID] = [];
            }

            // push tag id so we've all the tags for new item in the end of the loop
            newItemsTags[itemID].push(tag[tagUniqueIdentifier]);
          }

          await updateTag(cluster, tag[tagUniqueIdentifier], { items: [...tag.items] }, false);

          // update the loopTagID so that we update the parent
          loopTagID = tag.parent;
        }

        // handling saving of new items
        for (let item in newItemsTags) {
          const itemIndex = getItemIndex(cluster, item);
          // if the item is not in cluster
          if (itemIndex === -1) {
            const newItem = { tags: newItemsTags[item], id: item };
            cluster.Items.push(newItem);
          } else {
            // add new tags to the existing item in cluster
            cluster.Items[itemIndex] = cluster.Items[itemIndex].tags.concat(newItemsTags[item]);
          }
        }

        // return updated cluster
        return cluster;
      } catch (error) {
        throw error;
      }
    }

    // change the tag properties according to valueChange input and save to database
    async function updateTag(cluster, tagID, valueChange, reloadDatabase = true) {
      try {
        const index = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);

        // if the tag wasn't found
        if (index < -1) {
          const description = 'Error Description: \n\t==>Updating tag Failed. No tag found with such id';
          const error = new Error(description);
          this.emit('error', new Error('Invalid id'), description);
          throw error;
        }

        for (let attribute in valueChange) {
          cluster.Tags[index][attribute] = valueChange[attribute];
        }
        if (reloadDatabase) await updateDoc(cluster.clusterID, cluster);
      } catch (error) {
        // pass the error the the caller
        throw error;
      }
    }

    // return tag. Tag can be asked with the identifier or it can be the root tag
    function getTag(cluster, property, value) {
      try {
        // return root of the cluster
        if (property === 'root' && value === true) {
          const root = getRoot(cluster);
          return root;
        }

        // return tag matching given identifier
        if (property === tagUniqueIdentifier) return getTagByID(cluster, value);

        // throw error if requested property is invalid
        throw new Error(`No property such as ${property}`);
      } catch (error) {
        // pass the error the the caller
        throw error;
      }

      // return tag with required identifier
      function getTagByID(cluster, id) {
        // finding tag
        const tag = cluster.Tags.find((t) => t[tagUniqueIdentifier] === id);

        // failed to find tag
        if (!tag) {
          // pass the error the the caller
          const error = new Error('No tag found with such id');
          throw error;
        }

        return tag;
      }

      // return root of the given cluster
      function getRoot(cluster) {
        const root = cluster.Tags.find((t) => t.root);
        // if there's no root(if the cluster is empty or just initialized)
        if (!root) return null;
        // return root
        else return root;
      }
    }

    // insert new tag to cluster
    async function saveNewTag(cluster, newTag) {
      try {
        cluster.Tags.push(newTag);
      } catch (error) {
        throw error;
      }
    }

    // handling tag insertion
    // inserting new tag, if root is true then new tag will be the parent of the current root
    this.insertTag = async function (clusterID, tagName = null, tagID = null, attachToID = null, root = false) {
      try {
        let cluster = await getDocByID(clusterID);

        // add new tag to cluster
        cluster = await insertTagToCluster(cluster, tagName, tagID, attachToID, root);

        // update and save changed cluster to database
        await updateDoc(cluster.clusterID, cluster);
      } catch (error) {
        const description = 'Error Description: \n\t==>Inserting new tag failed';
        this.emit('error', error, description);
      }
    };

    // inserts the tag to given cluster and returns the cluster
    async function insertTagToCluster(cluster, tagName = null, tagID = null, attachToID = null, root = false) {
      if (root) {
        // get root of the cluster
        const root = getTag(cluster, 'root', true);

        // if there's a root already update it
        // change previous root to a simple node in tree(previous root is child of new root)
        if (root) await updateTag(cluster, root[tagUniqueIdentifier], { root: false, parent: tagID }, false);

        // insert new root. No need to refresh the database since we do it in saveNewTag couple of lines below
        await saveNewTag(cluster, {
          root: true,
          childrenTags: root ? [root[tagUniqueIdentifier]] : [],
          tagName: tagName,
          items: root ? [...root.items] : [],
          parent: null, // no parent for root
          id: tagID,
        });
      } else {
        // retrieve the tag that we want to append to
        const attachTag = getTag(cluster, tagUniqueIdentifier, attachToID);

        // insert new children tag. No need to refresh the database since we do it in saveNewTag couple of lines below
        attachTag.childrenTags.push(tagID);
        await updateTag(cluster, attachToID, { childrenTags: attachTag.childrenTags }, false);

        // save new tag to cluster
        await saveNewTag(cluster, {
          root: false,
          childrenTags: [],
          tagName: tagName,
          items: [],
          parent: attachToID, // set parent
          id: tagID,
        });
      }

      return cluster;
    }

    // return requested item with same identifier as itemID
    function getItemIndex(cluster, itemID) {
      const index = cluster.Items.findIndex((i) => i[itemUniqueIdentifier] === itemID);
      return index;
    }

    this.deleteItem = async function (clusterID, itemID) {
      try {
        const cluster = await getDocByID(clusterID);
        const itemIndex = getItemIndex(cluster, itemID);

        // if item was not found
        if (itemIndex < -1) {
          const error = new Error('Item with such identifier was not found');
          throw error;
        }

        const item = cluster.Items[itemIndex];

        // remove itemID from all the tags
        for (let i = 0; i < item.tags.length; i++) {
          const tagID = item.tags[i];
          const tag = getTag(cluster, tagUniqueIdentifier, tagID);
          const itemIndex = tag.items.findIndex((i) => i === itemID);
          tag.items.splice(itemIndex, 1);

          await updateTag(cluster, tagID, { items: tag.items }, false);
        }

        // remove item from cluster items list
        cluster.Items.splice(itemIndex, 1);

        // update changed cluster
        await updateDoc(cluster.clusterID, cluster);
      } catch (error) {
        const description = 'Error Description: \n\t==>Retrieving item failed. No item with such id';
        this.emit('error', error, description);
      }
    };

    this.deleteTag = async function (clusterID, tagID) {
      try {
        const cluster = await getDocByID(clusterID);

        // remove the tag from the cluster tags list
        const tagIndex = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);

        if (tagIndex < -1) {
          const description = 'Error Description: \n\t==>Deleting tag failed. No tag with such id';
          const error = new Error('Deleting tag failed');
          this.emit('error', error, description);
        }

        // incase of removing root
        if (cluster.Tags[tagIndex].root) {
          // remove all the tags
          cluster.Tags = [];

          // clear all the tags from items
          for (let i = 0; i < cluster.Items.length; i++) {
            cluster.Items[i].tags = [];
          }

          return;
        }

        const removeTags = []; // removing one tag will result in removing all of its child tags

        // for traversing the tag tree
        let stack = [];

        stack.push(tagID);

        while (stack.length > 0) {
          const id = stack.pop();
          const tag = getTag(cluster, tagUniqueIdentifier, id);

          // insert to the list to remove after this while loop
          removeTags.push(tag[tagUniqueIdentifier]);

          // add the children tags to the stack
          stack = stack.concat(tag.childrenTags);
        }

        // delete all the tags and items related to tagID
        await clearTags(cluster, removeTags);
      } catch (error) {
        const description = 'Error Description: \n\t==>Deleting tag failed';
        this.emit('error', error, description);
      }
    };

    // updates cluster so that all the references to tagsList is gone
    async function clearTags(cluster, tagsList) {
      try {
        // remove tags from all the items that have some of the tagsList
        for (let i = 0; i < cluster.Items.length; i++) {
          let tagIndex;

          // remove tags from item's tags
          for (let t = 0; t < tagsList.length; t++) {
            tagIndex = cluster.Items[i].tags.findIndex((tag) => tag === tagsList[t]);

            // if tag wasn't in item's tag then continue to next tag
            if (tagIndex === -1) {
              continue;
            } else {
              // remove tag from item's tags
              cluster.Items[i].tags.splice(tagIndex, 1);
            }
          }
        }

        // remove tags from the Tags
        for (let i = 0; i < tagsList.length; i++) {
          const tagIndex = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagsList[i]);

          cluster.Tags.splice(tagIndex, 1);
        }

        // find and update the parent of the deleting tag
        for (let i = 0; i < tagsList.length; i++) {
          // find parent
          const index = cluster.Tags[i].childrenTags.findIndex((t) => t === tagsList[0]);
          if (index < 0) {
            continue;
          } else {
            // remove tag from parent tag
            cluster.Tags[i].childrenTags.splice(index, 1);
            break;
          }
        }

        await updateDoc(cluster.clusterID, cluster);
      } catch (error) {
        // pass the error to the caller
        throw error;
      }
    }

    // retrieves all the tags for specific item
    this.retrieveTags = async function (clusterID, itemID) {
      const cluster = await getDocByID(clusterID);
      const item = cluster.Items.find((item) => item[itemUniqueIdentifier] === itemID);

      // if item is not found
      if (item == undefined) {
        const description = 'Error Description: \n\t==>No item was found with such id';
        this.emit('error', new Error('Invalid id'), description);
      } else return item.tags;
    };

    // retrieve all the items for specific tag
    this.retrieveItems = async function (clusterID, tagID) {
      const cluster = await getDocByID(clusterID);
      const tag = cluster.Tags.find((tag) => tag[tagUniqueIdentifier] === tagID);

      // if no tag was found
      if (tag == undefined) {
        const description = 'Error Description: \n\t==>No tag was found with such id';
        this.emit('error', new Error('Invalid id'), description);
      } else return tag.items;
    };

    // retrieve children tags
    this.retrieveChildrenTags = async function (clusterID, tagID) {
      const cluster = await getDocByID(clusterID);
      const tag = getTag(cluster, tagUniqueIdentifier, tagID);
      const children = tag.childrenTags;
      return children;
    };

    this.createAndInsert = async function (clusterID, tagIDList, tagNameList = [], attachToID, itemIDList) {
      // loading cluster
      let cluster = await getDocByID(clusterID);

      // the tag that next tagID will be attached to
      let currentTag = attachToID;
      for (let i = 0; i < tagIDList.length; i++) {
        cluster = await insertTagToCluster(
          cluster,
          tagNameList[i] ? tagNameList[i] : '',
          tagIDList[i],
          currentTag,
          false
        );

        // update value of currentTag for next iteration
        currentTag = tagIDList[i];
      }
      // insert items to the last tag in tagIDList
      cluster = insertItemsToCluster(cluster, itemIDList, currentTag);
      // save cluster to database
      await updateDoc(cluster.clusterID, cluster);
    };
  }
}

module.exports = Tagger;
