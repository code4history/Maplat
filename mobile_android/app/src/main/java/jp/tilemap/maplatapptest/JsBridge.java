package jp.tilemap.maplatapptest;

import android.content.Context;
import android.os.Handler;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

public class JsBridge extends Object {
    Context mContext;
    WebView mWebView;
    Handler mHandler;

    public JsBridge(Context c, WebView w, Handler h) {
        mContext = c;
        mWebView = w;
        mHandler = h;
    }

    @JavascriptInterface
    public void callWeb2App(String key, String data) {
        if (key.equals("callApp2Web") && data.equals("ready")) {
            this.callApp2Web("setMarker", "{\"latitude\":39.69994722,\"longitude\":141.1501111,\"data\":{\"id\":1,\"data\":1}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.7006006,\"longitude\":141.1529555,\"data\":{\"id\":5,\"data\":5}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.701599,\"longitude\":141.151995,\"data\":{\"id\":6,\"data\":6}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.703736,\"longitude\":141.151137,\"data\":{\"id\":7,\"data\":7}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.7090232,\"longitude\":141.1521671,\"data\":{\"id\":9,\"data\":9}}");
        } else {
            Toast.makeText(mContext, key + ":" + data, Toast.LENGTH_LONG).show();
        }
    }

    private void callApp2Web(final String key, final String data) {
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                mWebView.loadUrl("javascript:jsBridge.callApp2Web('" + key + "','" + data + "');");
            }
        });
    }
}
