define(['model/maplatbase', 'backbone', 'underscore'], function(MaplatBase, Backbone, _) {
    var Map = MaplatBase.extend({
        defaults: {
            title: '',
            attr: '',
            gcps: []
        }
    });
    return Map;
});
