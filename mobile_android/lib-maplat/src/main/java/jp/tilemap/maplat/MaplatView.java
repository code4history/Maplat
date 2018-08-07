package jp.tilemap.maplat;

import android.content.Context;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.webkit.WebView;
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

    public void setMaplatBridgeListener(MaplatBridgeListener maplatBridgeListener) {
        mMaplatBridge.setMaplatBridgeListener(maplatBridgeListener);
    }

    public MaplatBridge getMaplatBridge() {
        return mMaplatBridge;
    }

    public void setMaplatBridge(MaplatBridge maplatBridge) {
        this.mMaplatBridge = maplatBridge;
    }

    /**
     * MaplatBridgeの初期化
     */
    public void initSetting(MaplatBridgeListener listner, String appID, HashMap<String, Object> setting) {
        try {
            mMaplatBridge = new MaplatBridge(getContext(), mWebView, new Handler(), listner, appID, setting);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * WebViewの初期化
     */
    private void init() {
        mWebView = new WebView(getContext());
        WebView.setWebContentsDebuggingEnabled(true);
        addView(mWebView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
    }

    public void changeMap(String mapID) {
        mMaplatBridge.changeMap(mapID);
    }

    public void addMarker(double latitude, double longitude, long markerId, long markerData) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData);
    }
    public void addMarker(double latitude, double longitude, long markerId, long markerData, String iconUrl) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, double markerData) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData);
    }
    public void addMarker(double latitude, double longitude, long markerId, double markerData, String iconUrl) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, String markerData) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData);
    }
    public void addMarker(double latitude, double longitude, long markerId, String markerData, String iconUrl) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, ArrayList<Object> markerData) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData);
    }
    public void addMarker(double latitude, double longitude, long markerId, ArrayList<Object> markerData, String iconUrl) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, HashMap<String, Object> markerData) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData);
    }
    public void addMarker(double latitude, double longitude, long markerId, HashMap<String, Object> markerData, String iconUrl) {
        mMaplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl);
    }

    public void clearMarker() {
        mMaplatBridge.clearMarker();
    }
    public void clearLine() {
        mMaplatBridge.clearLine();
    }

    public void setViewpoint(double latitude, double longitude) {
        mMaplatBridge.setViewpoint(latitude, longitude);
    }
    public void setDirection(double direction) {
        mMaplatBridge.setDirection(direction);
    }
    public void setRotation(double rotation) {
        mMaplatBridge.setRotation(rotation);
    }

    public void setGPSMarker(double latitude, double longitude, double accuracy) {
        mMaplatBridge.setGPSMarker(latitude, longitude, accuracy);
    }
    public void addLine(ArrayList<ArrayList<Double>> lnglats, HashMap<String, Object> stroke) {
        mMaplatBridge.addLine(lnglats, stroke);
    }

    public void currentMapInfo(IMaplatMapCallbackHandler callback) {
        mMaplatBridge.currentMapInfo(callback);
    }

    public void mapInfo(String sourceID, IMaplatMapCallbackHandler callback) {
        mMaplatBridge.mapInfo(sourceID, callback);
    }
}
