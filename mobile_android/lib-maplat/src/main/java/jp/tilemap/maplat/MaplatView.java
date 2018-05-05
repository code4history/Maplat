package jp.tilemap.maplat;

import android.content.Context;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * MaplatのWebViewを内包したView
 *
 * @author Ishimaru Sohei
 */
public class MaplatView extends RelativeLayout {

    private MaplatBridge mMaplatBridge;

    /** 現在のマップの名称 */
    private String mNowMap;
    /** WebView */
    private WebView mWebView;

    public MaplatView(@NonNull Context context) {
        this(context, null, 0);
    }

    public MaplatView(@NonNull Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public MaplatView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    public void setMaplatBridgeListener(MaplatBridge.MaplatBridgeListener maplatBridgeListener) {
        mMaplatBridge.setMaplatBridgeListener(maplatBridgeListener);
    }

    public MaplatBridge getMaplatBridge() {
        return mMaplatBridge;
    }

    public void setMaplatBridge(MaplatBridge maplatBridge) {
        this.mMaplatBridge = maplatBridge;
    }

    /**
     * WebViewの初期化
     */
    private void init() {
        mWebView = new WebView(getContext());
        WebView.setWebContentsDebuggingEnabled(true);
        addView(mWebView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        /* TODO: setting情報を外部から容易に指定できる機構がほしい */
        try {
            mMaplatBridge = new MaplatBridge(getContext(), mWebView, new Handler(), null, "mobile",
                    new HashMap<String, Object>() {{
                        put("app_name", "モバイルアプリ");
                        put("sources", new ArrayList<Object>(){{
                            add("gsi");
                            add("osm");
                            add(new HashMap<String, String>(){{
                                put("mapID", "morioka_ndl");
                            }});
                        }});
                        put("pois", new ArrayList<Object>());
                    }});
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
