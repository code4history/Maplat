package jp.tilemap.maplatapptest;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Handler;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.text.TextUtils;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.LocationSettingsRequest;
import com.google.android.gms.location.LocationSettingsResponse;
import com.google.android.gms.location.LocationSettingsStatusCodes;
import com.google.android.gms.location.SettingsClient;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MaplatBridge extends Object {

    public interface MaplatBridgeListener {
        void onReady();
        void onClickMarker(int markerId, Object markerData);
        void onChangeViewpoint(double latitude, double longitude, double zoom, double direction, double rotation);
        void onOutOfMap();
        void onClickMap(double latitude, double longitude);
    }

    MaplatBridgeListener mListener;

    Context mContext;
    WebView mWebView;
    Handler mHandler;
    String initializeValue;

    private FusedLocationProviderClient mFusedLocationClient;
    private SettingsClient mSettingsClient;
    private LocationRequest mLocationRequest;
    private LocationSettingsRequest mLocationSettingsRequest;
    private LocationCallback mLocationCallback;

    /**
     * Represents a geographical location.
     */
    private Location mCurrentLocation;

    public MaplatBridge(Context c, WebView w, Handler h, String appID, JSONObject setting) {
        this(c, w, h, null, appID, setting);
    }

    public MaplatBridge(Context c, WebView w, Handler h, MaplatBridgeListener l, String appID, JSONObject setting) {
        mContext = c;
        mWebView = w;
        mHandler = h;
        mListener = l;

        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(c);
        mSettingsClient = LocationServices.getSettingsClient(c);
        createLocationCallback();
        createLocationRequest();
        buildLocationSettingsRequest();

        //リンクをタップしたときに標準ブラウザを起動させない
        mWebView.setWebViewClient(new WebViewClient() {
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
                        } finally {
                        }
                    } catch (Exception e){
                        // エラー発生時の処理
                    }
                }
                return ret;
            }
        });
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d("MyApplication", consoleMessage.message() + " -- From line "
                        + consoleMessage.lineNumber() + " of "
                        + consoleMessage.sourceId());
                return true;
            }
        });

        mWebView.getSettings().setJavaScriptEnabled(true);
        mWebView.addJavascriptInterface(this,"maplatBridge");
        mWebView.loadUrl("http://localresource/mobile.html");

        if (appID == null) {
            appID = "mobile";
        }
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("appid", appID);
            if (setting != null) {
                jsonObj.put("setting", setting);
            }
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        initializeValue = jsonObj.toString();
    }

    @JavascriptInterface
    public void callWeb2App(final String key, final String data) {
        if (mListener == null) return;
        if (key.equals("ready")){
            if (data.equals("callApp2Web")) {
                callApp2Web("maplatInitialize", initializeValue);
            } else if (data.equals("maplatObject")) {
                mHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        mListener.onReady();
                    }
                });
            }
        } else if (key.equals("clickMarker")) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    int markerId = 0;
                    Object markerData = null;
                    try {
                        JSONObject jsonObj = new JSONObject(data);
                        markerId = jsonObj.getInt("id");
                        markerData = jsonObj.get("data");
                    } catch (org.json.JSONException e) {
                        e.printStackTrace();
                    }
                    mListener.onClickMarker(markerId, markerData);
                }
            });
        } else if (key.equals("changeViewpoint")) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    double latitude = 0;
                    double longitude = 0;
                    double zoom = 0;
                    double direction = 0;
                    double rotation = 0;
                    try {
                        JSONObject jsonObj = new JSONObject(data);
                        latitude = jsonObj.getDouble("latitude");
                        longitude = jsonObj.getDouble("longitude");
                        zoom = jsonObj.getDouble("zoom");
                        direction = jsonObj.getDouble("direction");
                        rotation = jsonObj.getDouble("rotation");
                    } catch (org.json.JSONException e) {
                        e.printStackTrace();
                    }
                    mListener.onChangeViewpoint(latitude, longitude, zoom, direction, rotation);
                }
            });
        } else if (key.equals("outOfMap")) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    mListener.onOutOfMap();
                }
            });
        } else if (key.equals("clickMap")) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    double latitude = 0;
                    double longitude = 0;
                    try {
                        JSONObject jsonObj = new JSONObject(data);
                        latitude = jsonObj.getDouble("latitude");
                        longitude = jsonObj.getDouble("longitude");
                    } catch (org.json.JSONException e) {
                        e.printStackTrace();
                    }
                    mListener.onClickMap(latitude, longitude);
                }
            });
        }
    }

    public void addMarker(double latitude, double longitude, int markerId, int markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, int markerId, int markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("data", markerData);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        addMarkerInternal(latitude, longitude, markerId, jsonObj, iconUrl);
    }
    public void addMarker(double latitude, double longitude, int markerId, double markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, int markerId, double markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("data", markerData);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        addMarkerInternal(latitude, longitude, markerId, jsonObj, iconUrl);
    }
    public void addMarker(double latitude, double longitude, int markerId, String markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, int markerId, String markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("data", markerData);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        addMarkerInternal(latitude, longitude, markerId, jsonObj, iconUrl);
    }
    public void addMarker(double latitude, double longitude, int markerId, JSONArray markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, int markerId, JSONArray markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("data", markerData);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        addMarkerInternal(latitude, longitude, markerId, jsonObj, iconUrl);
    }
    public void addMarker(double latitude, double longitude, int markerId, JSONObject markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, int markerId, JSONObject markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("data", markerData);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        addMarkerInternal(latitude, longitude, markerId, jsonObj, iconUrl);
    }

    private void addMarkerInternal(double latitude, double longitude, int markerId, JSONObject jsonObj, String iconUrl) {
        try {
            jsonObj.put("longitude", longitude);
            jsonObj.put("latitude", latitude);
            jsonObj.put("id", markerId);
            if (!TextUtils.isEmpty(iconUrl)) {
                jsonObj.put("icon", iconUrl);
            }
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("addMarker", value);
    }

    public void clearMarker() {
        callApp2Web("clearMarker", null);
    }

    public void setGPSMarker(double latitude, double longitude, double accuracy) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("longitude", longitude);
            jsonObj.put("latitude", latitude);
            jsonObj.put("accuracy", accuracy);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("setGPSMarker", value);
    }

    public void changeMap(String mapID) {
        callApp2Web("changeMap", mapID);
    }

    public void setViewpoint(double latitude, double longitude) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("longitude", longitude);
            jsonObj.put("latitude", latitude);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("moveTo", value);
    }

    public void setDirection(double direction) {
        double dirRad = direction * Math.PI / 180.0;
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("direction", dirRad);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("moveTo", value);
    }

    public void setRotation(double rotate) {
        double rotRad = rotate * Math.PI / 180.0;
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("rotate", rotRad);
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("moveTo", value);
    }

    public void addLine(JSONArray lnglats, JSONObject stroke) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("lnglats", lnglats);
            if (stroke != null) {
                jsonObj.put("stroke", stroke);
            }
        } catch (org.json.JSONException e) {
            e.printStackTrace();
        }
        String value = jsonObj.toString();
        callApp2Web("addLine", value);
    }

    public void clearLine() {
        callApp2Web("clearLine", null);
    }

    private void callApp2Web(final String key, final String data) {
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                mWebView.loadUrl("javascript:maplatBridge.callApp2Web('" + key + "','" + data + "');");
            }
        });
    }

    private static final long UPDATE_INTERVAL_IN_MILLISECONDS = 10000;
    private static final long FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS = UPDATE_INTERVAL_IN_MILLISECONDS / 2;

    private void createLocationRequest() {
        mLocationRequest = new LocationRequest();
        mLocationRequest.setInterval(UPDATE_INTERVAL_IN_MILLISECONDS);
        mLocationRequest.setFastestInterval(FASTEST_UPDATE_INTERVAL_IN_MILLISECONDS);
        mLocationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
    }

    private void createLocationCallback() {
        mLocationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                super.onLocationResult(locationResult);
                mCurrentLocation = locationResult.getLastLocation();
                setGPSMarker(mCurrentLocation.getLatitude(), mCurrentLocation.getLongitude(), mCurrentLocation.getAccuracy());
            }
        };
    }

    private void buildLocationSettingsRequest() {
        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder();
        builder.addLocationRequest(mLocationRequest);
        mLocationSettingsRequest = builder.build();
    }

    public void startLocationUpdates() {
        mSettingsClient.checkLocationSettings(mLocationSettingsRequest)
                .addOnSuccessListener((Activity) mContext, new OnSuccessListener<LocationSettingsResponse>() {
                    @Override
                    public void onSuccess(LocationSettingsResponse locationSettingsResponse) {
                        Log.i("MaplatBridge", "All location settings are satisfied.");

                        //noinspection MissingPermission
                        if (ActivityCompat.checkSelfPermission(mContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                            return;
                        }
                        mFusedLocationClient.requestLocationUpdates(mLocationRequest, mLocationCallback, Looper.myLooper());
                    }
                })
                .addOnFailureListener((Activity)mContext, new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        int statusCode = ((ApiException) e).getStatusCode();
                        switch (statusCode) {
                            case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
                                Log.i("MaplatBridge", "Location settings are not satisfied. Attempting to upgrade location settings.");
                                break;
                            case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                                String errorMessage = "Location settings are inadequate, and cannot be fixed here. Fix in Settings.";
                                Log.e("MaplatBridge", errorMessage);
                                Toast.makeText(mContext, errorMessage, Toast.LENGTH_LONG).show();
                                break;
                        }
                    }
                });
    }


}
