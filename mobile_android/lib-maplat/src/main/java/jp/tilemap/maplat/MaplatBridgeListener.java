package jp.tilemap.maplat;

/**
 * Created by kokogiko on 2018/05/06.
 */

public interface MaplatBridgeListener {
    void onReady();
    void onClickMarker(long markerId, Object markerData);
    void onChangeViewpoint(double latitude, double longitude, double zoom, double direction, double rotation);
    void onOutOfMap();
    void onClickMap(double latitude, double longitude);
}