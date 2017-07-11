define(['model/maplatbase', 'backbone', 'underscore'], function(MaplatBase, Backbone, _) {
    var Map = MaplatBase.extend({
        defaults: {
            title: '',
            attr: '',
            gcps: []
        },
        validate: function(attrs) {
            var err = {};
            if (attrs.mapID == null || attrs.mapID == '') err['mapID'] = '地図IDを指定してください。';
            if (attrs.mapID && !attrs.mapID.match(/^[\d\w_\-]+$/)) err['mapID'] = '地図IDは英数字とアンダーバー、ハイフンのみが使えます。';
            if (attrs.title == null || attrs.title == '') err['title'] = '地図名称を指定してください。';
            if (attrs.attr == null || attrs.attr == '') err['attr'] = 'アトリビューションを指定してください。';
            if (Object.keys(err).length > 0) return err;
        },
        gcpsEditReady: function() {
            var attrs = this.attributes;
            return attrs.width && attrs.height && attrs.url;
        }
    });
    return Map;
});
