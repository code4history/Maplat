define(['model/maplatbase', 'backbone', 'underscore'], function(MaplatBase, Backbone, _) {
    var Map = MaplatBase.extend({
        defaults: {
            title: '',
            attr: '',
            gcps: []
        },
        validate: function(attrs) {
            if (!attrs.mapID) return 'No mapID';
            if (!attrs.title) return 'No title';
        },
        gcpsEditReady: function() {
            var attrs = this.attributes;
            return attrs.width && attrs.height && attrs.url;
        }
    });
    return Map;
});
