define(['backbone', 'underscore', 'deepcompare'], function(Backbone, _, deepcompare) {
    var MaplatBase = Backbone.Model.extend({
        initialize: function(value) {
            this.setCurrentAsDefault();
        },
        cancelChanges: function() {
            var changed = this.changedAttributes();

            if(!changed)
                return;

            var keys = _.keys(changed);
            var prev = _.pick(this.previousAttributes(), keys);

            this.set(prev); // , {silent: true}); // "silent" is optional; prevents change event
        },
        reset: function() {
            this.__dirty = false;
            this.clear({silent: true}).set(this.__defObject);
        },
        setCurrentAsDefault: function() {
            this.__dirty = false;
            this.__defObject = JSON.parse(JSON.stringify(this.attributes));
        },
        trigger: function(arg) {
            if (arg == 'change' && this.__defObject) {
                var dirty = false;
                var keys = _.union(Object.keys(this.attributes), Object.keys(this.__defObject));
                var self = this;
                _.each(keys, function(key) {
                    if (!deepcompare(self.attributes[key], self.__defObject[key])) dirty = true;
                });
                this.__dirty = dirty;
            }
            Backbone.Model.prototype.trigger.call(this, arg);
        },
        dirty: function() {
            return this.__dirty;
        },
        dirtyKeyList: function() {
            if (!this.__dirty) return [];
            var keys = _.union(Object.keys(this.attributes), Object.keys(this.__defObject));
            var self = this;
            return keys.filter(function(key) {
                return !deepcompare(self.attributes[key], self.__defObject[key]);
            });
        }
    });
    return MaplatBase;
});
