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
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
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

import org.json.JSONObject;

public class JsBridge extends Object {

    public interface JsBridgeListener {
        void onReady();
        void onClickPoi(int markerId, Object markerData);
    }

    JsBridgeListener mListener;

    Context mContext;
    WebView mWebView;
    Handler mHandler;

    private FusedLocationProviderClient mFusedLocationClient;
    private SettingsClient mSettingsClient;
    private LocationRequest mLocationRequest;
    private LocationSettingsRequest mLocationSettingsRequest;
    private LocationCallback mLocationCallback;

    /**
     * Represents a geographical location.
     */
    private Location mCurrentLocation;

    public JsBridge(Context c, WebView w, Handler h) {
        this(c, w, h, null);
    }

    public JsBridge(Context c, WebView w, Handler h, JsBridgeListener l) {
        mContext = c;
        mWebView = w;
        mHandler = h;
        mListener = l;

        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(c);
        mSettingsClient = LocationServices.getSettingsClient(c);
        createLocationCallback();
        createLocationRequest();
        buildLocationSettingsRequest();
    }

    @JavascriptInterface
    public void callWeb2App(final String key, final String data) {
        if (mListener == null) return;
        if (key.equals("callApp2Web") && data.equals("ready")) {
            mHandler.post(new Runnable() {
                @Override
                public void run() {
                    mListener.onReady();
                }
            });
        } else if (key.equals("clickPoi")) {
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
                mListener.onClickPoi(markerId, markerData);
                }
            });
        }
    }

    public void addMarker(double latitude, double longitude, int markerId, String markerData) {
        addMarker(latitude, longitude, markerId, markerData, null);
    }

    public void addMarker(double latitude, double longitude, int markerId, String markerData, String iconUrl) {
        JSONObject jsonObj = new JSONObject();
        try {
            jsonObj.put("longitude", longitude);
            jsonObj.put("latitude", latitude);
            jsonObj.put("id", markerId);
            jsonObj.put("data", markerData);
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

    private void callApp2Web(final String key, final String data) {
        mHandler.post(new Runnable() {
            @Override
            public void run() {
                mWebView.loadUrl("javascript:jsBridge.callApp2Web('" + key + "','" + data + "');");
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
                        Log.i("JsBridge", "All location settings are satisfied.");

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
                                Log.i("JsBridge", "Location settings are not satisfied. Attempting to upgrade location settings.");
                                break;
                            case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
                                String errorMessage = "Location settings are inadequate, and cannot be fixed here. Fix in Settings.";
                                Log.e("JsBridge", errorMessage);
                                Toast.makeText(mContext, errorMessage, Toast.LENGTH_LONG).show();
                                break;
                        }
                    }
                });
    }


}
