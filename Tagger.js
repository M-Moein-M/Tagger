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
    // refactor this ?????????????????????????
    this.printTags = function (clusterID) {
      const cluster = getDocByID(clusterID);

      let currentNode = getTag(cluster, 'root', true);
      let currentLevel = 0;

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

    function updateTag(cluster, tagID, valueChange, reloadDatabase = true) {
      const index = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);
      for (let attribute in valueChange) {
        cluster.Tags[index][attribute] = valueChange[attribute];
      }
      if (reloadDatabase) updateDoc(cluster.clusterID, cluster);
    }

    function getTag(cluster, property, value) {
      if (property === 'root' && value === true) {
        const root = getRoot(cluster);
        return root;
      } else if (property === 'id') return getTagByID(cluster, value);
      else console.log(`No property such as ${property}`);
    }

    function getTagByID(cluster, id) {
      const tag = cluster.Tags.find((t) => t[tagUniqueIdentifier] === id);
      return tag;
    }

    function getRoot(cluster) {
      const root = cluster.Tags.find((t) => t.root);
      // if there's no root(if the cluster is empty or just initialized)
      if (!root) return null;
      // return root
      else return root;
    }

    // insert new tag to cluster
    function insertNewTag(cluster, newTag) {
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

        // insert new root
        insertNewTag(cluster, {
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

        // insert new children tag
        attachTag.childrenTags.push(tagID);
        updateTag(cluster, attachToID, { childrenTags: attachTag.childrenTags }, false);

        insertNewTag(cluster, {
          root: false,
          childrenTags: [],
          tagName: tagName,
          items: [],
          id: tagID,
        });
      }
    };
  }
}

module.exports = Tagger;
