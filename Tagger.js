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
    this.printTags = function () {
      let currentNode = getTag('root', true);
      let currentLevel = 0;

      let queue = [];
      queue.push(Object.assign(currentNode, { nodeLevel: currentLevel }));

      while (queue.length > 0) {
        currentNode = queue.shift();
        if (currentNode.nodeLevel === currentLevel + 1) {
          console.log('\n');
          currentLevel++;
        }
        process.stdout.write(currentNode.tagName + '\t');
        // console.log(currentNode.tagName);

        for (let i = 0; i < currentNode.childrenTags.length; i++) {
          let child = getTag(tagUniqueIdentifier, currentNode.childrenTags[i]);
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

    function getTag(cluster, property, value) {
      if (property === 'root') return getRoot(cluster);
      else if (property === 'id') return getTagByID(value);
      else console.log(`No property such as ${property}`);
    }

    function getTagByID(id) {
      const tag = cluster.Tags.find((t) => t[tagUniqueIdentifier] === id)[0];
      return root;
    }

    function getRoot(cluster) {
      const root = cluster.Tags.find((t) => t.root)[0];
      return root;
    }

    function updateTag(cluster, tagID, valueChange, reloadDatabase = true) {
      const index = cluster.Tags.findIndex((t) => t[tagUniqueIdentifier] === tagID);
      for (attribute in valueChange) {
        cluster.Tags[index][attribute] = valueChange[attribute];
      }
      if (reloadDatabase) updateDoc(cluster.clusterID, cluster);
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

        updateTag(cluster, root[tagUniqueIdentifier], { root: false }, false);

        insertNewTag(cluster, {
          root: true,
          childrenTags: [root[tagUniqueIdentifier]],
          tagName: tagName,
          items: [...root.items],
          id: tagID,
        });
      } else {
        const attachTag = getTag(cluster, tagUniqueIdentifier, attachToID);
        updateTag(cluster, attachToID[tagUniqueIdentifier], { childrenTags: attachTag.childrenTags.push(tagID) });
        insertNewTag({
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
