define(['backbone', 'underscore_extension'], function(Backbone, _) {
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
            this.__dirty_hash = {};
            this.clear({silent: true}).set(this.__defObject);
        },
        setCurrentAsDefault: function() {
            this.__dirty_hash = {};
            this.__defObject = JSON.parse(JSON.stringify(this.attributes));
        },
        trigger: function(arg) {
            if (arg == 'change' && this.__defObject) {
                var self = this;
                _.each(this.changedAttributes(), function(value, key) {
                    self.__dirty_hash[key] = !_.isDeepEqual(value, self.__defObject[key]);
                });
            }
            Backbone.Model.prototype.trigger.call(this, arg);
        },
        dirty: function() {
            return this.dirtyKeyList().length > 0;
        },
        dirtyKeyList: function() {
            var self = this;
            return Object.keys(self.__dirty_hash).filter(function(key) {
                return self.__dirty_hash[key];
            });
        }
    });
    return MaplatBase;
});
