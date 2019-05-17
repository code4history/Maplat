package jp.tilemap.maplatapptest

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.support.v4.app.ActivityCompat
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.Toast
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.location.*
import com.google.android.gms.tasks.OnSuccessListener
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import jp.tilemap.maplat.IMaplatMapCallbackHandler
import jp.tilemap.maplat.IMaplatViewListener
import jp.tilemap.maplat.MaplatView
import java.util.*

class MainActivity : Activity(), IMaplatViewListener {

    var button1: Button? = null
    var button2: Button? = null
    var button3: Button? = null
    var button4: Button? = null
    var button5: Button? = null
    var button6: Button? = null
    var button7: Button? = null

    lateinit var mMaplatView: MaplatView
    lateinit var nowMap: String
    private var nowDirection: Double = 0.0
    private var nowRotation: Double = 0.0

    lateinit var mFusedLocationClient: FusedLocationProviderClient
    lateinit var mSettingsClient: SettingsClient
    lateinit var mLocationRequest: LocationRequest
    lateinit var mLocationSettingsRequest: LocationSettingsRequest
    lateinit var mLocationCallback: LocationCallback

    /**
     * Represents a geographical location.
     */
    lateinit var mCurrentLocation: Location

    private var defaultLongitude = 0.0
    private var defaultLatitude = 0.0
    lateinit var mGson: Gson

    override fun onCreate(savedInstanceState: Bundle?) {
        val self = this
        mGson = GsonBuilder()
                .create()
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= 23) {
            checkLocationPermission()
        }

        setContentView(R.layout.activity_main)

        //レイアウトで指定したWebViewのIDを指定する。
        mMaplatView = findViewById<View>(R.id.webView1) as MaplatView
        nowMap = "morioka_ndl"
        nowDirection = 0.0
        nowRotation = 0.0

        mMaplatView.initSetting(this, "mobile", object : HashMap<String, Any>() {
            init {
                put("app_name", "モバイルアプリ")
                put("sources", object : ArrayList<Any>() {
                    init {
                        add("gsi")
                        add("osm")
                        add(object : HashMap<String, String>() {
                            init {
                                put("mapID", "morioka_ndl")
                            }
                        })
                    }
                })
                put("pois", ArrayList<Any>())
            }
        })

        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        mSettingsClient = LocationServices.getSettingsClient(this)
        createLocationCallback()
        createLocationRequest()
        buildLocationSettingsRequest()

        button1 = findViewById(R.id.button1)
        button1!!.setOnClickListener {
            val nextMap = if (nowMap == "morioka_ndl") "gsi" else "morioka_ndl"
            mMaplatView.changeMap(nextMap)
            nowMap = nextMap
        }

        button2 = findViewById(R.id.button2)
        button2!!.setOnClickListener { addMarkers() }

        button3 = findViewById(R.id.button3)
        button3!!.setOnClickListener {
            mMaplatView.clearLine()
            mMaplatView.clearMarker()
        }

        button4 = findViewById(R.id.button4)
        button4!!.setOnClickListener { mMaplatView.setViewpoint(39.69994722, 141.1501111) }

        button5 = findViewById(R.id.button5)
        button5!!.setOnClickListener {
            val nextDirection: Double
            if (nowDirection == 0.0) {
                nextDirection = -90.0
                button5!!.text = "南を上"
            } else if (nowDirection == -90.0) {
                nextDirection = 180.0
                button5!!.text = "西を上"
            } else if (nowDirection == 180.0) {
                nextDirection = 90.0
                button5!!.text = "北を上"
            } else {
                nextDirection = 0.0
                button5!!.text = "東を上"
            }
            mMaplatView.setDirection(nextDirection)
            nowDirection = nextDirection
        }

        button6 = findViewById(R.id.button6)
        button6!!.setOnClickListener {
            val nextRotation: Double
            if (nowRotation == 0.0) {
                nextRotation = -90.0
                button6!!.text = "下を上"
            } else if (nowRotation == -90.0) {
                nextRotation = 180.0
                button6!!.text = "左を上"
            } else if (nowRotation == 180.0) {
                nextRotation = 90.0
                button6!!.text = "上を上"
            } else {
                nextRotation = 0.0
                button6!!.text = "右を上"
            }
            mMaplatView.setRotation(nextRotation)
            nowRotation = nextRotation
        }

        button7 = findViewById(R.id.button7)
        button7!!.setOnClickListener {
            mMaplatView.currentMapInfo(object : IMaplatMapCallbackHandler {
                override fun callback(value: Map<String, Any>?) {
                    val text = mGson.toJson(value)
                    Toast.makeText(self, text, Toast.LENGTH_SHORT).show()
                }
            })
        }
    }

    // 位置情報許可の確認
    fun checkLocationPermission() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            return  // 既に許可している
        }

        if (ActivityCompat.shouldShowRequestPermissionRationale(this, Manifest.permission.ACCESS_FINE_LOCATION)) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), REQUEST_PERMISSION)
        } else {
            val toast = Toast.makeText(this, "許可しないとアプリが実行できません", Toast.LENGTH_SHORT)
            toast.show()
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), REQUEST_PERMISSION)
        }
    }

    private fun createLocationRequest() {
        mLocationRequest = LocationRequest()
        mLocationRequest.interval = UPDATE_INTERVAL_IN_MILLISECONDS
        mLocationRequest.fastestInterval = FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS
        mLocationRequest.priority = LocationRequest.PRIORITY_HIGH_ACCURACY
    }

    private fun createLocationCallback() {
        mLocationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult?) {
                super.onLocationResult(locationResult)
                mCurrentLocation = locationResult!!.lastLocation
                val latitude: Double
                val longitude: Double
                if (defaultLatitude == 0.0 || defaultLongitude == 0.0) {
                    defaultLatitude = mCurrentLocation.latitude
                    defaultLongitude = mCurrentLocation.longitude
                    latitude = baseLatitude
                    longitude = baseLongitude
                } else {
                    latitude = baseLatitude - defaultLatitude + mCurrentLocation.latitude
                    longitude = baseLongitude - defaultLongitude + mCurrentLocation.longitude
                }
                mMaplatView.setGPSMarker(latitude, longitude, mCurrentLocation.accuracy.toDouble())
            }
        }
    }

    private fun buildLocationSettingsRequest() {
        val builder = LocationSettingsRequest.Builder()
        builder.addLocationRequest(mLocationRequest)
        mLocationSettingsRequest = builder.build()
    }

    fun startLocationUpdates() {
        val mContext = this
        mSettingsClient.checkLocationSettings(mLocationSettingsRequest)
                .addOnSuccessListener(this, OnSuccessListener {
                    Log.i("MaplatBridge", "All location settings are satisfied.")


                    if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                        return@OnSuccessListener
                    }
                    mFusedLocationClient.requestLocationUpdates(mLocationRequest, mLocationCallback, Looper.myLooper())
                })
                .addOnFailureListener(this) { e ->
                    val statusCode = (e as ApiException).statusCode
                    when (statusCode) {
                        LocationSettingsStatusCodes.RESOLUTION_REQUIRED -> Log.i("MaplatBridge", "Location settings are not satisfied. Attempting to upgrade location settings.")
                        LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE -> {
                            val errorMessage = "Location settings are inadequate, and cannot be fixed here. Fix in Settings."
                            Log.e("MaplatBridge", errorMessage)
                            Toast.makeText(mContext, errorMessage, Toast.LENGTH_LONG).show()
                        }
                    }
                }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        if (requestCode == REQUEST_PERMISSION) {
            if (grantResults[0] != PackageManager.PERMISSION_GRANTED) {
                val toast = Toast.makeText(this, "アプリを実行できません", Toast.LENGTH_SHORT)
                toast.show()
            }
        }
    }

    override fun onReady() {
        addMarkers()
        startLocationUpdates()
    }

    override fun onClickMarker(markerId: String, markerData: Any?) {
        val value = String.format(Locale.US, "clickMarker ID: %s DATA: %s", markerId, markerData)
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show()
    }

    override fun onChangeViewpoint(x: Double, y: Double, latitude: Double, longitude: Double, mercator_x: Double,
                                   mercator_y: Double, zoom: Double, merc_zoom: Double, direction: Double, rotation: Double) {
        Log.d("changeViewpoint", String.format("XY: (%f, %f) LatLong: (%f, %f) Mecrator: (%f, %f) zoom: %f mercZoom: %f direction: %f rotation %f", x, y, latitude, longitude, mercator_x, mercator_y, zoom, merc_zoom, direction, rotation))
    }

    override fun onOutOfMap() {
        Toast.makeText(this, "地図範囲外です", Toast.LENGTH_SHORT).show()
    }

    override fun onClickMap(latitude: Double, longitude: Double) {
        val value = String.format(Locale.US, "clickMap latitude: %f longitude: %f", latitude, longitude)
        Toast.makeText(this, value, Toast.LENGTH_SHORT).show()
    }

    private fun addMarkers() {
        try {
            mMaplatView.addLine(object : ArrayList<ArrayList<Double>>() {
                init {
                    add(object : ArrayList<Double>() {
                        init {
                            add(141.1501111)
                            add(39.69994722)
                        }
                    })
                    add(object : ArrayList<Double>() {
                        init {
                            add(141.1529555)
                            add(39.7006006)
                        }
                    })
                }
            }, null)
            mMaplatView.addLine(object : ArrayList<ArrayList<Double>>() {
                init {
                    add(object : ArrayList<Double>() {
                        init {
                            add(141.151995)
                            add(39.701599)
                        }
                    })
                    add(object : ArrayList<Double>() {
                        init {
                            add(141.151137)
                            add(39.703736)
                        }
                    })
                    add(object : ArrayList<Double>() {
                        init {
                            add(141.1521671)
                            add(39.7090232)
                        }
                    })
                }
            }, object : HashMap<String, Any>() {
                init {
                    put("color", "#ffcc33")
                    put("width", 2)
                }
            })
        } catch (e: Exception) {
            e.printStackTrace()
        }

        mMaplatView.addMarker(39.69994722, 141.1501111, 1, "001")
        mMaplatView.addMarker(39.7006006, 141.1529555, 5, "005")
        mMaplatView.addMarker(39.701599, 141.151995, 6, "006")
        mMaplatView.addMarker(39.703736, 141.151137, 7, "007")
        mMaplatView.addMarker(39.7090232, 141.1521671, 9, "009")
    }

    companion object {

        private val REQUEST_PERMISSION = 10

        private val baseLongitude = 141.1529555
        private val baseLatitude = 39.7006006

        private val UPDATE_INTERVAL_IN_MILLISECONDS: Long = 10000
        private val FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS = UPDATE_INTERVAL_IN_MILLISECONDS / 2
    }
}
