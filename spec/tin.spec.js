var Tin = require('../js/tin');
var testHelper = require('./TestHelper');

describe('Tin 動作テスト', function() {
  describe('実データテスト', function() {
    var load_map = require('./maps/fushimijo_maplat.json');
    var load_cmp = require('./compiled/fushimijo_maplat.json');
    var tin = new Tin({
      wh: [load_map.width, load_map.height],
      strictMode: load_map.strictMode,
      vertexMode: load_map.vertexMode
    });
    tin.setPoints(load_map.gcps);

    it('実データ比較', testHelper.helperAsync(async function() {
      await tin.updateTinAsync();
      expect(tin.getCompiled()).toEqual(load_cmp.compiled);
    }));
  });
});