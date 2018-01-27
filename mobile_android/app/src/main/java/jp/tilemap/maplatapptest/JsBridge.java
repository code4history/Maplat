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

public class JsBridge extends Object {
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
        mContext = c;
        mWebView = w;
        mHandler = h;

        mFusedLocationClient = LocationServices.getFusedLocationProviderClient(c);
        mSettingsClient = LocationServices.getSettingsClient(c);
        createLocationCallback();
        createLocationRequest();
        buildLocationSettingsRequest();
    }

    @JavascriptInterface
    public void callWeb2App(String key, String data) {
        if (key.equals("callApp2Web") && data.equals("ready")) {
            this.callApp2Web("setMarker", "{\"latitude\":39.69994722,\"longitude\":141.1501111,\"data\":{\"id\":1,\"data\":1}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.7006006,\"longitude\":141.1529555,\"data\":{\"id\":5,\"data\":5}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.701599,\"longitude\":141.151995,\"data\":{\"id\":6,\"data\":6}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.703736,\"longitude\":141.151137,\"data\":{\"id\":7,\"data\":7}}");
            this.callApp2Web("setMarker", "{\"latitude\":39.7090232,\"longitude\":141.1521671,\"data\":{\"id\":9,\"data\":9}}");

            this.callApp2Web("setMarker", "{\"latitude\":35.661787,\"longitude\":139.700032,\"data\":{\"id\":10,\"data\":\"Dots\"}}");

            startLocationUpdates();
        } else {
            Toast.makeText(mContext, key + ":" + data, Toast.LENGTH_LONG).show();
        }
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

                String value = "{\"latitude\":" + mCurrentLocation.getLatitude()
                        + ",\"longitude\":" + mCurrentLocation.getLongitude()
                        + ",\"accuracy\":" + mCurrentLocation.getAccuracy() + "}";
                JsBridge.this.callApp2Web("setGPSMarker", value);
            }
        };
    }

    private void buildLocationSettingsRequest() {
        LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder();
        builder.addLocationRequest(mLocationRequest);
        mLocationSettingsRequest = builder.build();
    }

    private void startLocationUpdates() {
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
