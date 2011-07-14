var FindNodeVisitor = function(name) { 
    osg.NodeVisitor.call(this, osg.NodeVisitor.TRAVERSE_ALL_CHILDREN); 
    this.init();
    this._name = name;
};
FindNodeVisitor.prototype = osg.objectInehrit( osg.NodeVisitor.prototype, {
    init: function() {
        this.found = [];
    },
    apply: function(node) {
        if (node.getName() === this._name) {
            this.found.push(node);
        }
        this.traverse(node);
    }

});

