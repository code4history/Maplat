package jp.tilemap.maplat

import android.content.Context
import android.os.Handler
import android.util.AttributeSet
import android.webkit.WebView
import android.widget.RelativeLayout

import java.util.ArrayList
import java.util.HashMap

/**
 * MaplatのWebViewを内包したView
 *
 * @author Ishimaru Sohei
 */
class MaplatView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) : RelativeLayout(context, attrs, defStyleAttr) {

    lateinit var maplatBridge: MaplatBridge

    /** 現在のマップの名称  */
    private val mNowMap: String? = null
    /** WebView  */
    lateinit var mWebView: WebView

    init {
        init()
    }

    fun setMaplatBridgeListener(maplatBridgeListener: MaplatBridgeListener) {
        maplatBridge.setMaplatBridgeListener(maplatBridgeListener)
    }

    /**
     * MaplatBridgeの初期化
     */
    fun initSetting(listner: MaplatBridgeListener, appID: String, setting: HashMap<String, Any>) {
        try {
            maplatBridge = MaplatBridge(context, mWebView, Handler(), listner, appID, setting)
        } catch (e: Exception) {
            e.printStackTrace()
        }

    }

    /**
     * WebViewの初期化
     */
    private fun init() {
        mWebView = WebView(context)
        WebView.setWebContentsDebuggingEnabled(true)
        addView(mWebView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun changeMap(mapID: String) {
        maplatBridge.changeMap(mapID)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Long) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Long, iconUrl: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Double) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Double, iconUrl: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: String, iconUrl: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: ArrayList<Any>) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: ArrayList<Any>, iconUrl: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: HashMap<String, Any>) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData)
    }

    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: HashMap<String, Any>, iconUrl: String) {
        maplatBridge.addMarker(latitude, longitude, markerId, markerData, iconUrl)
    }

    fun clearMarker() {
        maplatBridge.clearMarker()
    }

    fun clearLine() {
        maplatBridge.clearLine()
    }

    fun setViewpoint(latitude: Double, longitude: Double) {
        maplatBridge.setViewpoint(latitude, longitude)
    }

    fun setDirection(direction: Double) {
        maplatBridge.setDirection(direction)
    }

    fun setRotation(rotation: Double) {
        maplatBridge.setRotation(rotation)
    }

    fun setGPSMarker(latitude: Double, longitude: Double, accuracy: Double) {
        maplatBridge.setGPSMarker(latitude, longitude, accuracy)
    }

    fun addLine(lnglats: ArrayList<ArrayList<Double>>, stroke: HashMap<String, Any>?) {
        maplatBridge.addLine(lnglats, stroke)
    }

    fun currentMapInfo(callback: IMaplatMapCallbackHandler) {
        maplatBridge.currentMapInfo(callback)
    }

    fun mapInfo(sourceID: String, callback: IMaplatMapCallbackHandler) {
        maplatBridge.mapInfo(sourceID, callback)
    }
}
