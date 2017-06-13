package jp.tilemap.maplatapptest;

//import android.support.v7.app.AppCompatActivity;
import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import android.util.Log;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import android.content.res.AssetManager;

public class MainActivity extends Activity {
    //@SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        //レイアウトで指定したWebViewのIDを指定する。
        WebView myWebView = (WebView)findViewById(R.id.webView1);
        myWebView.setWebContentsDebuggingEnabled(true);
        AssetManager am = this.getAssets();

        //リンクをタップしたときに標準ブラウザを起動させない
        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(final WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                String regex = "https?://localresource/";
                Pattern p = Pattern.compile(regex);
                Matcher m = p.matcher(url);
                WebResourceResponse ret = null;
                if (m.find()) {
                    String fileName = m.replaceFirst("");
                    int point = fileName.lastIndexOf("?");
                    if (point != -1) {
                        fileName = fileName.substring(0, point - 1);
                    }
                    String ext = fileName;
                    point = fileName.lastIndexOf(".");
                    if (point != -1) {
                        ext = fileName.substring(point + 1);
                    }
                    Log.d(ext,ext);
                    String mime = ext.equals("html") ? "text/html" :
                            ext.equals("js") ? "application/javascript" :
                            ext.equals("json") ? "application/json" :
                            ext.equals("jpg") ? "image/jpeg" :
                            ext.equals("png") ? "image/png" :
                            ext.equals("css") ? "text/css" :
                            ext.equals("gif") ? "image/gif" :
                            ext.equals("woff") ? "application/font-woff" :
                            ext.equals("woff2") ? "application/font-woff2" :
                            ext.equals("ttf") ? "application/font-ttf" :
                            ext.equals("eot") ? "application/vnd.ms-fontobject" :
                            ext.equals("otf") ? "application/font-otf" :
                            ext.equals("svg") ? "image/svg+xml" :
                            "text/plain";
                    InputStream is = null;
                    BufferedReader br = null;
                    String text = "";

                    try {
                        try {
                            is = view.getContext().getAssets().open(fileName);
                            ret = new WebResourceResponse(mime, "UTF-8", is);
                            //br = new BufferedReader(new InputStreamReader(is));

                            // １行ずつ読み込み、改行を付加する
                            //String str;
                            //while ((str = br.readLine()) != null) {
                            //    text += str + "\n";
                            //}
                        } finally {
                            //if (is != null) is.close();
                            //if (br != null) br.close();
                        }
                    } catch (Exception e){
                        // エラー発生時の処理
                    }
                }
                return ret;
            }
        });
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("MyApplication", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }
        });
        myWebView.loadUrl("http://localresource/mobile_sample.html");

        myWebView.getSettings().setJavaScriptEnabled(true);
        myWebView.addJavascriptInterface(new JsBridge(this, myWebView, new Handler()),"jsBridge");
    }

    /*@Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }*/
}
