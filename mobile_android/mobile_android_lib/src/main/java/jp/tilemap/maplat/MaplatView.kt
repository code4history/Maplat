package jp.tilemap.maplat

import android.content.Context
import android.os.Handler
import android.text.TextUtils
import android.util.AttributeSet
import android.util.Log
import android.webkit.*
import android.widget.RelativeLayout
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.internal.LinkedTreeMap
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken
import com.google.gson.stream.JsonWriter
import java.io.IOException
import java.util.*

import java.util.regex.Pattern

/**
 * MaplatのWebViewを内包したView
 *
 * @author Ishimaru Sohei
 */
class MaplatView @JvmOverloads constructor(context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0) : RelativeLayout(context, attrs, defStyleAttr) {
    /** WebView  */
    lateinit var mWebView: WebView

    private lateinit var mInitializeValue: Map<String, Any>
    private lateinit var mGson: Gson
    private var callbackStore: MutableMap<String, IMaplatStringCallbackHandler> = HashMap()

    private lateinit var mHandler: Handler
    private var mListener: IMaplatViewListener? = null

    init {
        init()
    }

    fun setMaplatViewListener(maplatViewLListener: IMaplatViewListener) {
        mListener = maplatViewLListener
    }

    /**
     * MaplatBridgeの初期化
     */
    fun initSetting(listner: IMaplatViewListener, appID: String?, setting: HashMap<String, Any>?) {
        try {
            mListener = listner

            val adapter = CustomizedObjectTypeAdapter()
            mGson = GsonBuilder().run {
                registerTypeHierarchyAdapter(Map::class.java, adapter)
                        .registerTypeHierarchyAdapter(List::class.java, adapter)
                        .registerTypeHierarchyAdapter(Double::class.java, adapter)
                        .registerTypeHierarchyAdapter(Long::class.java, adapter)
                        .registerTypeHierarchyAdapter(String::class.java, adapter)
                        .create()
            }

            //リンクをタップしたときに標準ブラウザを起動させない
            mWebView.webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                    val url = request.url.toString()
                    val regex = "https?://localresource/"
                    val p = Pattern.compile(regex)
                    val m = p.matcher(url)
                    var ret: WebResourceResponse? = null
                    if (m.find()) {
                        var fileName = m.replaceFirst("")
                        val resFileName = fileName.replace("/".toRegex(), "_")
                                .replace("\\.".toRegex(), "_")
                                .replace("\\-".toRegex(), "_")
                                .toLowerCase()
                        var point = fileName.lastIndexOf("?")
                        if (point != -1) {
                            fileName = fileName.substring(0, point - 1)
                        }
                        var ext = fileName
                        point = fileName.lastIndexOf(".")
                        if (point != -1) {
                            ext = fileName.substring(point + 1)
                        }
                        Log.d(ext, ext)
                        val mime = if (ext == "html")
                            "text/html"
                        else if (ext == "js")
                            "application/javascript"
                        else if (ext == "json")
                            "application/json"
                        else if (ext == "jpg")
                            "image/jpeg"
                        else if (ext == "png")
                            "image/png"
                        else if (ext == "css")
                            "text/css"
                        else if (ext == "gif")
                            "image/gif"
                        else if (ext == "woff")
                            "application/font-woff"
                        else if (ext == "woff2")
                            "application/font-woff2"
                        else if (ext == "ttf")
                            "application/font-ttf"
                        else if (ext == "eot")
                            "application/vnd.ms-fontobject"
                        else if (ext == "otf")
                            "application/font-otf"
                        else if (ext == "svg")
                            "image/svg+xml"
                        else
                            "text/plain"

                        try {
                            val res = view.context.resources
                            val resId = res.getIdentifier(resFileName, "raw", view.context.packageName)

                            val inputStream = if (resId != 0) res.openRawResource(resId) else view.context.assets.open(fileName)

                            ret = WebResourceResponse(mime, "UTF-8", inputStream)
                        } catch (e: Exception) {
                            // エラー発生時の処理
                        }

                    }
                    return ret
                }
            }

            mWebView.webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                    Log.d("MyApplication", consoleMessage.message() + " -- From line "
                            + consoleMessage.lineNumber() + " of "
                            + consoleMessage.sourceId())
                    return true
                }
            }

            mWebView.settings.javaScriptEnabled = true
            mWebView.addJavascriptInterface(this, "maplatBridge")
            mWebView.loadUrl("http://localresource/mobile.html")

            val obj = HashMap<String, Any>()
            obj["appid"] = appID ?: "mobile"
            if (setting != null) {
                obj["setting"] = setting
            }
            mInitializeValue = obj

            mHandler = Handler()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun normalizeObject(root: Any): Any {
        var res = root
        if (res is HashMap<*, *>) {
            val hashRoot = res as HashMap<String, Any>
            for ((key, value) in hashRoot) {
                hashRoot[key] = normalizeObject(value)
            }
            if (root.javaClass.getName().contains("$")) {
                res = HashMap(hashRoot)
            }
        } else if (res is LinkedTreeMap<*, *>) {
            val hashRoot = HashMap<String, Any>()
            val treeRoot = root as LinkedTreeMap<String, Any>
            for ((key, value) in treeRoot) {
                hashRoot[key] = normalizeObject(value)
            }
            res = hashRoot
        } else if (root is ArrayList<*>) {
            val arrayRoot = root as ArrayList<Any>
            for (i in arrayRoot.indices) {
                arrayRoot[i] = normalizeObject(arrayRoot[i])
            }
            if (res.javaClass.getName().contains("$")) {
                res = ArrayList(arrayRoot)
            }
        }
        return res
    }

    private fun jsonToObject(json: String, type: Class<*>?): Any {
        return if (type == null) {
            jsonToObject(json)
        } else {
            mGson.fromJson(json, type)
        }
    }

    private fun jsonToObject(json: String): Any {
        var ret: Any
        try {
            ret = mGson.fromJson<Map<*, *>>(json, Map::class.java)
        } catch (e1: Exception) {
            try {
                ret = mGson.fromJson<List<*>>(json, List::class.java)
            } catch (e2: Exception) {
                try {
                    ret = mGson.fromJson<Double>(json, Double::class.java)
                } catch (e3: Exception) {
                    try {
                        ret = mGson.fromJson<Long>(json, Long::class.java)
                    } catch (e4: Exception) {
                        ret = mGson.fromJson<String>(json, String::class.java)
                    }

                }

            }

        }

        return ret
    }

    private fun objectToJson(obj: Any): String {
        return mGson.toJson(normalizeObject(obj))
    }

    @JavascriptInterface
    fun callWeb2App(key: String, data: String) {
        if (mListener == null) return
        if (key == "ready") {
            if (data == "callApp2Web") {
                val arr = ArrayList<Any>()
                arr.add(mInitializeValue)
                callApp2Web("maplatInitialize", arr)
            } else if (data == "maplatObject") {
                mHandler.post { mListener!!.onReady() }
            }
        } else if (key == "clickMarker") {
            mHandler.post {
                var markerId = ""
                var markerData: Any? = null
                try {
                    @Suppress("UNCHECKED_CAST")
                    val obj = jsonToObject(data, Map::class.java) as Map<String, Any?>
                    markerId = obj["id"]?.toString() ?: ""
                    markerData = obj["data"]
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                mListener!!.onClickMarker(markerId, markerData)
            }
        } else if (key == "changeViewpoint") {
            mHandler.post {
                var x = 0.0
                var y = 0.0
                var latitude = 0.0
                var longitude = 0.0
                var mercator_x = 0.0
                var mercator_y = 0.0
                var zoom = 0.0
                var merc_zoom = 0.0
                var direction = 0.0
                var rotation = 0.0
                try {
                    @Suppress("UNCHECKED_CAST")
                    val obj = jsonToObject(data, Map::class.java) as Map<String, Number?>
                    x = obj["x"]?.toDouble() ?: 0.0
                    y = obj["y"]?.toDouble() ?: 0.0
                    latitude = obj["latitude"]?.toDouble() ?: 0.0
                    longitude = obj["longitude"]?.toDouble() ?: 0.0
                    mercator_x = obj["mercator_x"]?.toDouble() ?: 0.0
                    mercator_y = obj["mercator_y"]?.toDouble() ?: 0.0
                    zoom = obj["zoom"]?.toDouble() ?: 0.0
                    merc_zoom = obj["mercZoom"]?.toDouble() ?: 0.0
                    direction = obj["direction"]?.toDouble() ?: 0.0
                    rotation = obj["rotation"]?.toDouble() ?: 0.0
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                mListener!!.onChangeViewpoint(x, y, latitude, longitude, mercator_x, mercator_y, zoom, merc_zoom, direction, rotation)
            }
        } else if (key == "outOfMap") {
            mHandler.post { mListener!!.onOutOfMap() }
        } else if (key == "clickMap") {
            mHandler.post {
                var latitude = 0.0
                var longitude = 0.0
                try {
                    @Suppress("UNCHECKED_CAST")
                    val obj = jsonToObject(data, Map::class.java) as Map<String, Double>
                    latitude = obj["latitude"] ?: 0.0
                    longitude = obj["longitude"] ?: 0.0
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                mListener!!.onClickMap(latitude, longitude)
            }
        } else if (key == "methodCallback") {
            mHandler.post {
                var callbackKey = ""
                var value = ""
                try {
                    @Suppress("UNCHECKED_CAST")
                    val obj = jsonToObject(data, Map::class.java) as Map<String, String>
                    callbackKey = obj["key"] ?: ""
                    value = obj["value"] ?: ""
                } catch (e: Exception) {
                    e.printStackTrace()
                }

                val callback = callbackStore[callbackKey]
                callbackStore.remove(callbackKey)
                callback?.callback(value)
            }
        }
    }

    private fun callApp2Web(key: String, data: List<Any>, callback: IMaplatStringCallbackHandler? = null) {
        val jsonStr = objectToJson(data)
        var callbackKey = ""
        if (callback != null) {
            val u1 = UUID.randomUUID()
            callbackKey = u1.toString()
            callbackStore[callbackKey] = callback
        }
        val callbackKey_ = callbackKey
        mHandler.post { mWebView.loadUrl("javascript:maplatBridge.callApp2Web('$key','$jsonStr','$callbackKey_');") }
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
        val arr = ArrayList<Any>()
        arr.add(mapID)
        callApp2Web("changeMap", arr)
    }

    @JvmOverloads
    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Long, iconUrl: String? = null) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl)
    }

    @JvmOverloads
    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: Double, iconUrl: String? = null) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl)
    }

    @JvmOverloads
    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: String, iconUrl: String? = null) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl)
    }

    @JvmOverloads
    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: ArrayList<Any>, iconUrl: String? = null) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl)
    }

    @JvmOverloads
    fun addMarker(latitude: Double, longitude: Double, markerId: Long, markerData: HashMap<String, Any>, iconUrl: String? = null) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl)
    }


    private fun addMarkerInternal(latitude: Double, longitude: Double, markerId: Long, markerData: Any, iconUrl: String?) {
        val obj = HashMap<String, Any>()
        val lnglat = ArrayList<Double>()
        val arr = ArrayList<Any>()
        try {
            lnglat.add(longitude)
            lnglat.add(latitude)
            obj["lnglat"] = lnglat
            obj["data"] = markerData
            obj["id"] = markerId
            if (!TextUtils.isEmpty(iconUrl)) {
                obj["icon"] = iconUrl!!
            }
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("addMarker", arr)
    }

    fun clearMarker() {
        callApp2Web("clearMarker", ArrayList())
    }

    fun addLine(lnglats: ArrayList<ArrayList<Double>>, stroke: HashMap<String, Any>?) {
        val obj = HashMap<String, Any>()
        val arr = ArrayList<Any>()
        try {
            obj["lnglats"] = lnglats
            if (stroke != null) {
                obj["stroke"] = stroke
            }
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("addLine", arr)
    }

    fun clearLine() {
        callApp2Web("clearLine", ArrayList())
    }

    fun setViewpoint(latitude: Double, longitude: Double) {
        val obj = HashMap<String, Any>()
        val arr = ArrayList<Any>()
        try {
            obj["longitude"] = longitude
            obj["latitude"] = latitude
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("setViewpoint", arr)
    }

    fun setDirection(direction: Double) {
        val obj = HashMap<String, Any>()
        val arr = ArrayList<Any>()
        try {
            obj["direction"] = direction
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("setViewpoint", arr)
    }

    fun setRotation(rotation: Double) {
        val obj = HashMap<String, Any>()
        val arr = ArrayList<Any>()
        try {
            obj["rotation"] = rotation
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("setViewpoint", arr)
    }

    fun setGPSMarker(latitude: Double, longitude: Double, accuracy: Double) {
        val obj = HashMap<String, Any>()
        val lnglat = ArrayList<Double>()
        val arr = ArrayList<Any>()
        try {
            lnglat.add(longitude)
            lnglat.add(latitude)
            obj["lnglat"] = lnglat
            obj["acc"] = accuracy
            arr.add(obj)
        } catch (e: Exception) {
            e.printStackTrace()
        }

        callApp2Web("setGPSMarker", arr)
    }

    fun currentMapInfo(callback: IMaplatMapCallbackHandler) {
        callApp2Web("currentMapInfo", ArrayList(), object: IMaplatStringCallbackHandler {
            override fun callback(value: String) {
                if (value == "") {
                    callback.callback(null)
                    return
                }
                @Suppress("UNCHECKED_CAST")
                val obj = jsonToObject(value, Map::class.java) as Map<String, Any>
                callback.callback(obj)
            }
        })
    }

    fun mapInfo(sourceID: String, callback: IMaplatMapCallbackHandler) {
        val arr = ArrayList<Any>()
        arr.add(sourceID)
        callApp2Web("mapInfo", arr, object: IMaplatStringCallbackHandler {
            override fun callback(value: String) {
                if (value == "") {
                    callback.callback(null)
                    return
                }
                @Suppress("UNCHECKED_CAST")
                val obj = jsonToObject(value, Map::class.java) as Map<String, Any>
                callback.callback(obj)
            }
        })
    }
}

internal class CustomizedObjectTypeAdapter : TypeAdapter<Any>() {
    private val delegate = Gson().getAdapter<Any>(Any::class.java)

    @Throws(IOException::class)
    override fun write(out: JsonWriter, value: Any) {
        delegate.write(out, value)
    }

    @Throws(IOException::class)
    override fun read(reader: JsonReader): Any? {
        when (reader.peek()) {
            JsonToken.BEGIN_ARRAY -> {
                val list = ArrayList<Any?>()
                reader.beginArray()
                while (reader.hasNext()) {
                    list.add(read(reader))
                }
                reader.endArray()
                return list
            }

            JsonToken.BEGIN_OBJECT -> {
                val map = HashMap<String, Any?>()
                reader.beginObject()
                while (reader.hasNext()) {
                    map[reader.nextName()] = read(reader)
                }
                reader.endObject()
                return map
            }

            JsonToken.STRING -> return reader.nextString()

            JsonToken.NUMBER -> {
                //return in.nextDouble();
                val n = reader.nextString()
                return if (n.indexOf('.') != -1) {
                    java.lang.Double.parseDouble(n)
                } else java.lang.Long.parseLong(n)
            }

            JsonToken.BOOLEAN -> return reader.nextBoolean()

            JsonToken.NULL -> {
                reader.nextNull()
                return null
            }

            else -> throw IllegalStateException()
        }
    }
}