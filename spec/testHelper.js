/**
 * ユニットテストのヘルパークラス
 *
 * @constructor
 */
function TestHelper() {}

/**
 * 非同期メソッドのためのヘルパー
 *
 * @param {object} runAsync 補助対象の非同期メソッド
 */
function helperAsync(runAsync) {
    // doneを使って対応する
    return (done) => {
        runAsync().then(done, e => {
            fail(e);
        done();
    })
    };
}

TestHelper.prototype.helperAsync = helperAsync;

module.exports = new TestHelper();