class Tagger {
  constructor(insertDoc, updateDoc, getDocByID, tagUniqueIdentifier = 'id', itemUniqueIdentifier = 'id') {
    this.createNewCluster = function (clusterID) {
      // generate new cluster id incase the user didn't provide any
      if (clusterID == undefined) {
        clusterID = generateClusterID();
      }

      const cluster = {
        Tags: [],
        Items: [],
        clusterID: clusterID,
      };

      insertDoc(cluster);

      return clusterID;
    };

    function generateClusterID() {
      // generate random ID
      const order = 10;
      let id = '';
      for (let i = 0, id = ''; i < order; i++) id += Math.floor(Math.random() * 60466175).toString(36);
      return id;
    }

    // printing tags
    this.printTags = function (clusterID) {
      const cluster = getDocByID(clusterID);

      let currentNode = getTag(cluster, 'root', true);
      let currentLevel = 0; // to keep track of which level are we printing ATM. Used for better looking output

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
    };

    // handling item insertion
    this.insertItem = function (clusterID = null, itemID = null, tagID = null) {
      // check for valid itemID and tagID
      if (itemID === null) throw new Error('Null itemID');
      else if (tagID === null) throw new Error('Null TagID');
      else if (clusterID === null) throw new Error('Null clusterID');

      const newItemTags = [];

      const cluster = getDocByID(clusterID);
      let tag = getTag(cluster, tagUniqueIdentifier, tagID);

      const stack = [];
      stack.push(tag);

      // Traversing tags tree
      while (stack.length > 0) {
        const top = stack.pop();
        top.items.push(itemID);

        // push tag id so we've all the tags for new item in the end of the loop
        newItemTags.push(top[tagUniqueIdentifier]);

        updateTag(cluster, top[tagUniqueIdentifier], { items: top.items }, false);

        for (let i = 0; i < top.childrenTags.length; i++) {
          stack.push(getTag(cluster, tagUniqueIdentifier, top.childrenTags[i]));
        }
      }

      const newItem = { tags: newItemTags, id: itemID };
      cluster.Items.push(newItem);
      updateDoc(cluster.clusterID, cluster);
    };

    // change the tag properties according to valueChange input and save to database
    function updateTag(cluster, tagID, valueChange, reloadDatabase = true) {
      const index = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);
      for (let attribute in valueChange) {
        cluster.Tags[index][attribute] = valueChange[attribute];
      }
      if (reloadDatabase) updateDoc(cluster.clusterID, cluster);
    }

    // return tag. Tag can be asked with the identifier or it can be the root tag
    function getTag(cluster, property, value) {
      // return root of the cluster
      if (property === 'root' && value === true) {
        const root = getRoot(cluster);
        return root;
      }

      // return tag matching given identifier
      if (property === 'id') return getTagByID(cluster, value);

      // throw error if requested property is invalid
      throw new Error(`No property such as ${property}`);

      // return tag with required identifier
      function getTagByID(cluster, id) {
        // finding tag
        const tag = cluster.Tags.find((t) => t[tagUniqueIdentifier] === id);
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
    function saveNewTag(cluster, newTag) {
      cluster.Tags.push(newTag);
      updateDoc(cluster.clusterID, cluster);
    }

    // handling tag insertion
    // inserting new tag, if root is true then new tag will be the parent of the current root
    this.insertTag = function (clusterID, tagName = null, tagID = null, attachToID = null, root = false) {
      const cluster = getDocByID(clusterID);
      if (root) {
        // get root of the cluster
        const root = getTag(cluster, 'root', true);

        // if root was found
        if (root) updateTag(cluster, root[tagUniqueIdentifier], { root: false }, false);

        // insert new root. No need to refresh the database since we do it in saveNewTag couple of lines below
        saveNewTag(cluster, {
          root: true,
          childrenTags: root ? [root[tagUniqueIdentifier]] : [],
          tagName: tagName,
          items: root ? [...root.items] : [],
          id: tagID,
        });
      } else {
        // retrieve the tag that we want to append to
        const attachTag = getTag(cluster, tagUniqueIdentifier, attachToID);
        if (!attachTag) {
          throw new Error('No tag was found with requested id. Aborting inserting tag');
        }

        // insert new children tag. No need to refresh the database since we do it in saveNewTag couple of lines below
        attachTag.childrenTags.push(tagID);
        updateTag(cluster, attachToID, { childrenTags: attachTag.childrenTags }, false);

        // save new tag to cluster
        saveNewTag(cluster, {
          root: false,
          childrenTags: [],
          tagName: tagName,
          items: [],
          id: tagID,
        });
      }
    };

    // return requested item with same identifier as itemID
    function getItemIndex(cluster, itemID) {
      const index = cluster.Items.findIndex((i) => i[itemUniqueIdentifier] === itemID);
      return index;
    }

    this.deleteItem = async function (clusterID, itemID) {
      const cluster = getDocByID(clusterID);
      const itemIndex = getItemIndex(cluster, itemID);

      // no match for itemID
      if (itemIndex < 0) return;

      const item = cluster.Items[itemIndex];

      // remove itemID from all the tags
      for (let i = 0; i < item.tags.length; i++) {
        const tagID = item.tags[i];
        const tag = getTag(cluster, tagUniqueIdentifier, tagID);
        const itemIndex = tag.items.findIndex((i) => i === itemID);
        tag.items.splice(itemIndex, 1);

        updateTag(cluster, tagID, { items: tag.items }, false);
      }

      // remove item from cluster items list
      cluster.Items.splice(itemIndex, 1);

      // update changed cluster
      updateDoc(cluster.clusterID, cluster);
    };

    this.deleteTag = async function (clusterID, tagID) {
      const cluster = getDocByID(clusterID);

      // remove the tag from the cluster tags list
      const tagIndex = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);

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

      updateDoc(cluster.clusterID, cluster);
    };

    // updates cluster so that all the references to tagsList is gone
    async function clearTags(cluster, tagsList) {
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
    }
  }
}

module.exports = Tagger;
