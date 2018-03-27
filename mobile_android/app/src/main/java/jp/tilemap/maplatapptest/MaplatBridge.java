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
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.internal.LinkedTreeMap;
import com.google.gson.stream.JsonWriter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MaplatBridge extends Object {

    public interface MaplatBridgeListener {
        void onReady();
        void onClickMarker(long markerId, Object markerData);
        void onChangeViewpoint(double latitude, double longitude, double zoom, double direction, double rotation);
        void onOutOfMap();
        void onClickMap(double latitude, double longitude);
    }

    MaplatBridgeListener mListener;

    Context mContext;
    WebView mWebView;
    Handler mHandler;
    String mInitializeValue;
    Gson mGson;

    private FusedLocationProviderClient mFusedLocationClient;
    private SettingsClient mSettingsClient;
    private LocationRequest mLocationRequest;
    private LocationSettingsRequest mLocationSettingsRequest;
    private LocationCallback mLocationCallback;

    /**
     * Represents a geographical location.
     */
    private Location mCurrentLocation;

    public MaplatBridge(Context c, WebView w, Handler h, String appID, HashMap<String, Object> setting) {
        this(c, w, h, null, appID, setting);
    }

    public MaplatBridge(Context c, WebView w, Handler h, MaplatBridgeListener l, String appID, HashMap<String, Object> setting) {
        mContext = c;
        mWebView = w;
        mHandler = h;
        mListener = l;
        CustomizedObjectTypeAdapter adapter = new CustomizedObjectTypeAdapter();
        mGson = new GsonBuilder()
                .registerTypeHierarchyAdapter(Map.class, adapter)
                .registerTypeHierarchyAdapter(List.class, adapter)
                .registerTypeHierarchyAdapter(Double.class, adapter)
                .registerTypeHierarchyAdapter(Long.class, adapter)
                .registerTypeHierarchyAdapter(String.class, adapter)
                .create();

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
        Map<String, Object> obj = new HashMap<String, Object>();
        obj.put("appid", appID);
        if (setting != null) {
            obj.put("setting", setting);
        }
        mInitializeValue = objectToJson(obj);
    }

    private Object normalizeObject(Object root) {
        if (root instanceof HashMap) {
            HashMap<String, Object> hashRoot = (HashMap<String, Object>) root;
            for (Map.Entry<String, Object> entry : hashRoot.entrySet()) {
                hashRoot.put(entry.getKey(), normalizeObject(entry.getValue()));
            }
            if (root.getClass().getName().contains("$")) {
                root = new HashMap<String, Object>(hashRoot);
            }
        } else if (root instanceof LinkedTreeMap) {
            HashMap<String, Object> hashRoot = new HashMap<String, Object>();
            LinkedTreeMap<String, Object> treeRoot = (LinkedTreeMap<String, Object>) root;
            for (Map.Entry<String, Object> entry : treeRoot.entrySet()) {
                hashRoot.put(entry.getKey(), normalizeObject(entry.getValue()));
            }
            root = hashRoot;
        } else if (root instanceof ArrayList) {
            ArrayList<Object> arrayRoot = (ArrayList<Object>)root;
            for(int i = 0; i < arrayRoot.size(); ++i){
                arrayRoot.set(i, normalizeObject(arrayRoot.get(i)));
            }
            if (root.getClass().getName().contains("$")) {
                root = new ArrayList<Object>(arrayRoot);
            }
        }
        return root;
    }

    private Object jsonToObject(String json, Class type) {
        if (type == null) {
            return jsonToObject(json);
        } else {
            return mGson.fromJson(json, type);
        }
    }

    private Object jsonToObject(String json) {
        Object ret;
        try {
            ret = mGson.fromJson(json, Map.class);
        } catch (Exception e1) {
            try {
                ret = mGson.fromJson(json, List.class);
            } catch (Exception e2) {
                try {
                    ret = mGson.fromJson(json, Double.class);
                } catch (Exception e3) {
                    try {
                        ret = mGson.fromJson(json, Long.class);
                    } catch (Exception e4) {
                        ret = mGson.fromJson(json, String.class);
                    }
                }
            }
        }
        return ret;
    }

    private String objectToJson(Object obj) {
        return mGson.toJson(normalizeObject(obj));
    }

    @JavascriptInterface
    public void callWeb2App(final String key, final String data) {
        if (mListener == null) return;
        if (key.equals("ready")){
            if (data.equals("callApp2Web")) {
                callApp2Web("maplatInitialize", mInitializeValue);
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
                    long markerId = 0;
                    Object markerData = null;
                    try {
                        Map<String, Object> obj = (Map<String, Object>)jsonToObject(data, Map.class);
                        markerId = (Long)obj.get("id");
                        markerData = obj.get("data");
                    } catch (Exception e) {
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
                        Map<String, Double> obj = (Map<String, Double>)jsonToObject(data, Map.class);
                        latitude = obj.get("latitude");
                        longitude = obj.get("longitude");
                        zoom = obj.get("zoom");
                        direction = obj.get("direction");
                        rotation = obj.get("rotation");
                    } catch (Exception e) {
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
                        Map<String, Double> obj = (Map<String, Double>)jsonToObject(data, Map.class);
                        latitude = obj.get("latitude");
                        longitude = obj.get("longitude");
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    mListener.onClickMap(latitude, longitude);
                }
            });
        }
    }

    public void addMarker(double latitude, double longitude, long markerId, long markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, long markerId, long markerData, String iconUrl) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, double markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, long markerId, double markerData, String iconUrl) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, String markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, long markerId, String markerData, String iconUrl) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, ArrayList<Object> markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, long markerId, ArrayList<Object> markerData, String iconUrl) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl);
    }
    public void addMarker(double latitude, double longitude, long markerId, HashMap<String, Object> markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }
    public void addMarker(double latitude, double longitude, long markerId, HashMap<String, Object> markerData, String iconUrl) {
        addMarkerInternal(latitude, longitude, markerId, markerData, iconUrl);
    }

    private void addMarkerInternal(double latitude, double longitude, long markerId, Object markerData, String iconUrl) {
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("data", markerData);
            obj.put("longitude", longitude);
            obj.put("latitude", latitude);
            obj.put("id", markerId);
            if (!TextUtils.isEmpty(iconUrl)) {
                obj.put("icon", iconUrl);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
        callApp2Web("addMarker", value);
    }

    public void clearMarker() {
        callApp2Web("clearMarker", null);
    }

    public void setGPSMarker(double latitude, double longitude, double accuracy) {
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("longitude", longitude);
            obj.put("latitude", latitude);
            obj.put("accuracy", accuracy);
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
        callApp2Web("setGPSMarker", value);
    }

    public void changeMap(String mapID) {
        callApp2Web("changeMap", mapID);
    }

    public void setViewpoint(double latitude, double longitude) {
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("longitude", longitude);
            obj.put("latitude", latitude);
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
        callApp2Web("moveTo", value);
    }

    public void setDirection(double direction) {
        double dirRad = direction * Math.PI / 180.0;
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("direction", dirRad);
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
        callApp2Web("moveTo", value);
    }

    public void setRotation(double rotate) {
        double rotRad = rotate * Math.PI / 180.0;
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("rotate", rotRad);
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
        callApp2Web("moveTo", value);
    }

    public void addLine(ArrayList<ArrayList<Double>> lnglats, HashMap<String, Object> stroke) {
        Map<String, Object> obj = new HashMap<String, Object>();
        try {
            obj.put("lnglats", lnglats);
            if (stroke != null) {
                obj.put("stroke", stroke);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        String value = objectToJson(obj);
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

class CustomizedObjectTypeAdapter extends TypeAdapter<Object> {
    private final TypeAdapter<Object> delegate = new Gson().getAdapter(Object.class);

    @Override
    public void write(JsonWriter out, Object value) throws IOException {
        delegate.write(out, value);
    }

    @Override
    public Object read(JsonReader in) throws IOException {
        JsonToken token = in.peek();
        switch (token) {
            case BEGIN_ARRAY:
                List<Object> list = new ArrayList<Object>();
                in.beginArray();
                while (in.hasNext()) {
                    list.add(read(in));
                }
                in.endArray();
                return list;

            case BEGIN_OBJECT:
                Map<String, Object> map = new HashMap<String, Object>();
                in.beginObject();
                while (in.hasNext()) {
                    map.put(in.nextName(), read(in));
                }
                in.endObject();
                return map;

            case STRING:
                return in.nextString();

            case NUMBER:
                //return in.nextDouble();
                String n = in.nextString();
                if (n.indexOf('.') != -1) {
                    return Double.parseDouble(n);
                }
                return Long.parseLong(n);

            case BOOLEAN:
                return in.nextBoolean();

            case NULL:
                in.nextNull();
                return null;

            default:
                throw new IllegalStateException();
        }
    }
}